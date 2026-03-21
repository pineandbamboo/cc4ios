import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "in_progress" | "completed" | "archived";
  priority: "P1" | "P2";
  category: "documents" | "meetings" | "talent" | "email";
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  try {
    let query = "SELECT * FROM tasks WHERE 1=1";
    const params: string[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY priority DESC, created_at DESC";

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    const tasks: Task[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || "",
      status: row.status,
      priority: row.priority,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = "P2", category = "documents" } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, category, created_at, updated_at)
      VALUES (?, ?, ?, 'in_progress', ?, ?, ?, ?)
    `);

    stmt.run(id, title, description || "", priority, category, now, now);

    const task: Task = {
      id,
      title,
      description: description || "",
      status: "in_progress",
      priority,
      category,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
