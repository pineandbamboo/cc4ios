import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/status - Get overall system status
export async function GET() {
  try {
    // Get connection stats
    const connectionsStmt = db.prepare("SELECT status, COUNT(*) as count FROM server_connections GROUP BY status");
    const connectionStats = connectionsStmt.all() as any[];

    // Get task stats
    const tasksStmt = db.prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status");
    const taskStats = tasksStmt.all() as any[];

    // Get document count
    const docsStmt = db.prepare("SELECT COUNT(*) as count FROM documents");
    const docCount = docsStmt.get() as any;

    const status = {
      connections: {
        connected: 0,
        disconnected: 0,
        error: 0,
        total: 0,
      },
      tasks: {
        in_progress: 0,
        completed: 0,
        archived: 0,
        total: 0,
      },
      documents: docCount?.count || 0,
      timestamp: new Date().toISOString(),
    };

    connectionStats.forEach((stat) => {
      status.connections[stat.status as keyof typeof status.connections] = stat.count;
      status.connections.total += stat.count;
    });

    taskStats.forEach((stat) => {
      status.tasks[stat.status as keyof typeof status.tasks] = stat.count;
      status.tasks.total += stat.count;
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to get status:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
