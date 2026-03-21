import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// POST /api/connections/[id]/execute - Execute a terminal command on a remote instance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params;
    const body = await request.json();
    const { command, timeout } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "command is required and must be a string" },
        { status: 400 }
      );
    }

    // Get connection details from database
    const stmt = db.prepare("SELECT * FROM server_connections WHERE id = ?");
    const connection = stmt.get(connectionId) as {
      id: string;
      name: string;
      url: string;
      auth_token: string | null;
    } | undefined;

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Build target URL for the remote instance's execute endpoint
    const baseUrl = connection.url.replace(/\/$/, "");
    const targetUrl = `${baseUrl}/api/execute`;

    // Prepare headers with auth token if available
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (connection.auth_token) {
      headers["Authorization"] = `Bearer ${connection.auth_token}`;
    }

    // Build request body with optional timeout
    const payload: { command: string; timeout?: number } = { command };
    if (timeout && typeof timeout === "number" && timeout > 0) {
      payload.timeout = timeout;
    }

    // Forward request to remote instance
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    // Update connection status based on response
    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE server_connections
      SET status = ?, last_ping = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(response.ok ? "connected" : "error", now, now, connectionId);

    // Parse and return response
    const responseData = await response.json().catch(() => ({
      error: "Failed to parse response",
      status: response.status,
      statusText: response.statusText,
    }));

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("Execute error:", error);
    return NextResponse.json(
      { error: "Failed to execute command", details: String(error) },
      { status: 500 }
    );
  }
}
