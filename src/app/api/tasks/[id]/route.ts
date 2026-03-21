import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/[id] - Get a single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = {
      id: row.id,
      title: row.title,
      description: row.description || "",
      status: row.status,
      priority: row.priority,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, status, priority, category } = body;

    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tasks SET ${updates.join(", ")} WHERE id = ?
    `);

    stmt.run(...values);

    // Fetch updated task
    const getStmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
    const row = getStmt.get(id) as any;

    const task = {
      id: row.id,
      title: row.title,
      description: row.description || "",
      status: row.status,
      priority: row.priority,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
