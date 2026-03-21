import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export interface ServerConnection {
  id: string;
  name: string;
  url: string;
  auth_token?: string;
  status: "connected" | "disconnected" | "error";
  last_ping?: string;
}

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/connections - List all connections
export async function GET() {
  try {
    const stmt = db.prepare("SELECT * FROM server_connections ORDER BY created_at DESC");
    const rows = stmt.all() as any[];

    const connections: ServerConnection[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      auth_token: row.auth_token,
      status: row.status,
      last_ping: row.last_ping,
    }));

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}

// POST /api/connections - Create a new connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, auth_token } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO server_connections (id, name, url, auth_token, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'disconnected', ?, ?)
    `);

    stmt.run(id, name, url, auth_token || null, now, now);

    const connection: ServerConnection = {
      id,
      name,
      url,
      auth_token,
      status: "disconnected",
    };

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("Failed to create connection:", error);
    return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
  }
}
