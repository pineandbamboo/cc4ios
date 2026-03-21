import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// POST /api/proxy - Forward request to configured server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, endpoint, method = "GET", data, body: requestBody } = body;

    if (!connectionId || !endpoint) {
      return NextResponse.json(
        { error: "connectionId and endpoint are required" },
        { status: 400 }
      );
    }

    // Get connection details
    const stmt = db.prepare("SELECT * FROM server_connections WHERE id = ?");
    const connection = stmt.get(connectionId) as any;

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Build target URL
    const baseUrl = connection.url.replace(/\/$/, "");
    const targetUrl = `${baseUrl}${endpoint}`;

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (connection.auth_token) {
      headers["Authorization"] = `Bearer ${connection.auth_token}`;
    }

    // Use either data or requestBody (support both formats)
    const payload = data || requestBody;

    // Forward request
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method !== "GET" && payload ? JSON.stringify(payload) : undefined,
    });

    // Update connection status
    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE server_connections
      SET status = ?, last_ping = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(response.ok ? "connected" : "error", now, now, connectionId);

    // Return response
    const responseData = await response.json().catch(() => ({
      status: response.status,
      statusText: response.statusText,
    }));

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to server" },
      { status: 500 }
    );
  }
}
