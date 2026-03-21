# CEO Support Terminal Server

A lightweight FastAPI server that runs on remote machines to enable terminal access from the CEO Support App.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set auth token (required for security)
export TERMINAL_AUTH_TOKEN="your-secret-token"

# 3. Start server
python terminal-server.py
```

The server will start on `http://0.0.0.0:8080` by default.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `TERMINAL_AUTH_TOKEN` | `dev-token-change-in-prod` | Bearer token for authentication |
| `PORT` | `8080` | Server port |

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "terminal-server",
  "version": "1.0.0"
}
```

### POST /api/execute
Execute a shell command.

**Headers:**
- `Authorization: Bearer <your-token>`

**Request Body:**
```json
{
  "command": "ls -la",
  "timeout": 30
}
```

**Response:**
```json
{
  "output": "file1.txt\nfile2.txt",
  "error": null,
  "exit_code": 0,
  "duration_ms": 150,
  "command": "ls -la"
}
```

## Allowed Commands

For security, only these commands are allowed:
- Version control: `git`
- Package managers: `npm`, `node`
- Python: `python`, `python3`
- Editors: `code`, `code-insiders`, `claude`
- File operations: `ls`, `cat`, `pwd`, `grep`, `find`, `echo`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `head`, `tail`, `wc`, `sort`, `uniq`, `diff`
- Network: `curl`, `wget`
- Utilities: `jq`, `yq`, `rg`, `fd`, `bat`, `exa`, `tree`

To add more commands, edit the `ALLOWED_COMMANDS` list in `terminal-server.py`.

## Security Notes

1. **Always set a strong auth token in production**
2. The server binds to `0.0.0.0` by default - use firewall rules to restrict access
3. Commands are validated against a whitelist
4. Commands timeout after 30 seconds by default

## Running as a Service (macOS)

Create a launch agent at `~/Library/LaunchAgents/com.ceo-support.terminal.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ceo-support.terminal</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/path/to/ceo-support-server/terminal-server.py</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>TERMINAL_AUTH_TOKEN</key>
        <string>your-secret-token</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load with: `launchctl load ~/Library/LaunchAgents/com.ceo-support.terminal.plist`
