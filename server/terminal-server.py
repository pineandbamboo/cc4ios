"""
CEO Support Terminal Server
A lightweight FastAPI server for remote command execution.
"""

import os
import asyncio
import time
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configuration
AUTH_TOKEN = os.environ.get("TERMINAL_AUTH_TOKEN", "dev-token-change-in-prod")
ALLOWED_COMMANDS = [
    "git", "npm", "node", "python", "python3", "claude", "code", "code-insiders",
    "ls", "cat", "pwd", "grep", "find", "echo", "mkdir", "touch", "rm",
    "cp", "mv", "head", "tail", "wc", "sort", "uniq", "diff",
    "curl", "wget", "jq", "yq", "rg", "fd", "bat", "exa", "tree"
]

app = FastAPI(
    title="CEO Support Terminal Server",
    description="Remote command execution server for CEO Support App",
    version="1.0.0"
)

# CORS middleware for cross-origin requests from the app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class ExecuteRequest(BaseModel):
    command: str
    timeout: int = 30


class ExecuteResponse(BaseModel):
    output: str
    error: Optional[str] = None
    exit_code: int
    duration_ms: int
    command: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# Helpers
def validate_command(cmd: str) -> tuple[bool, str]:
    """Validate that the command is allowed."""
    if not cmd or not cmd.strip():
        return False, "Empty command"

    # Extract base command (first word)
    parts = cmd.strip().split()
    if not parts:
        return False, "Empty command"

    base_cmd = parts[0]

    # Handle commands with paths (e.g., /usr/bin/git)
    if "/" in base_cmd:
        base_cmd = base_cmd.split("/")[-1]

    # Check if command is in allowed list
    for allowed in ALLOWED_COMMANDS:
        if base_cmd == allowed:
            return True, ""

    return False, f"Command '{base_cmd}' not allowed. Allowed commands: {', '.join(ALLOWED_COMMANDS)}"


# Routes
@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        service="terminal-server",
        version="1.0.0"
    )


@app.post("/api/execute", response_model=ExecuteResponse)
async def execute(
    req: ExecuteRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Execute a shell command and return the output.

    Requires Bearer token authentication.
    Commands are validated against a whitelist.
    """
    # Auth check
    expected_auth = f"Bearer {AUTH_TOKEN}"
    if authorization != expected_auth:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Command validation
    is_valid, validation_error = validate_command(req.command)
    if not is_valid:
        return ExecuteResponse(
            output="",
            error=validation_error,
            exit_code=1,
            duration_ms=0,
            command=req.command
        )

    # Execute command
    start_time = time.time()

    try:
        proc = await asyncio.create_subprocess_shell(
            req.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            # Don't use shell=True for security, but we need shell for pipes/redirections
            # This is a tradeoff - in production, consider more restrictive execution
        )

        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=req.timeout
        )

        duration_ms = int((time.time() - start_time) * 1000)

        return ExecuteResponse(
            output=stdout.decode("utf-8", errors="replace") if stdout else "",
            error=stderr.decode("utf-8", errors="replace") if stderr else None,
            exit_code=proc.returncode if proc.returncode is not None else 0,
            duration_ms=duration_ms,
            command=req.command
        )

    except asyncio.TimeoutError:
        # Kill the process on timeout
        try:
            proc.kill()
            await proc.wait()
        except ProcessLookupError:
            pass

        return ExecuteResponse(
            output="",
            error=f"Command timed out after {req.timeout} seconds",
            exit_code=-1,
            duration_ms=req.timeout * 1000,
            command=req.command
        )

    except Exception as e:
        return ExecuteResponse(
            output="",
            error=f"Execution error: {str(e)}",
            exit_code=-1,
            duration_ms=int((time.time() - start_time) * 1000),
            command=req.command
        )


@app.get("/")
async def root():
    """Root endpoint with basic info."""
    return {
        "service": "CEO Support Terminal Server",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "execute": "/api/execute"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
