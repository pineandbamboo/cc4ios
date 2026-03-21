import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/connections/[id] - Get a single connection
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const stmt = db.prepare("SELECT * FROM server_connections WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const connection = {
      id: row.id,
      name: row.name,
      url: row.url,
      auth_token: row.auth_token,
      status: row.status,
      last_ping: row.last_ping,
    };

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("Failed to fetch connection:", error);
    return NextResponse.json({ error: "Failed to fetch connection" }, { status: 500 });
  }
}

// PATCH /api/connections/[id] - Update a connection
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, url, auth_token, status, last_ping } = body;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (url !== undefined) {
      updates.push("url = ?");
      values.push(url);
    }
    if (auth_token !== undefined) {
      updates.push("auth_token = ?");
      values.push(auth_token);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (last_ping !== undefined) {
      updates.push("last_ping = ?");
      values.push(last_ping);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE server_connections SET ${updates.join(", ")} WHERE id = ?`);
    stmt.run(...values);

    const getStmt = db.prepare("SELECT * FROM server_connections WHERE id = ?");
    const row = getStmt.get(id) as any;

    const connection = {
      id: row.id,
      name: row.name,
      url: row.url,
      auth_token: row.auth_token,
      status: row.status,
      last_ping: row.last_ping,
    };

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("Failed to update connection:", error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}

// DELETE /api/connections/[id] - Delete a connection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const stmt = db.prepare("DELETE FROM server_connections WHERE id = ?");
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete connection:", error);
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 });
  }
}
