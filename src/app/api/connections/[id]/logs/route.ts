import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

// Mock logs for demo - in production, these would come from the actual instance
function generateMockLogs(): LogEntry[] {
  const now = new Date();
  const logs: LogEntry[] = [];

  const messages = [
    { level: "info" as const, message: "Claude Code instance started" },
    { level: "info" as const, message: "Connected to Anthropic API" },
    { level: "debug" as const, message: "Loading project configuration from CLAUDE.md" },
    { level: "info" as const, message: "Watching files for changes..." },
    { level: "debug" as const, message: "Indexed 247 files in workspace" },
    { level: "info" as const, message: "Agent session initialized" },
    { level: "warn" as const, message: "High token usage detected: 85% of budget used" },
    { level: "info" as const, message: "Processing user request: 'Implement theme toggle'" },
    { level: "debug" as const, message: "Searching for relevant code patterns..." },
    { level: "info" as const, message: "Found 12 relevant files" },
    { level: "info" as const, message: "Writing ThemeProvider component..." },
    { level: "debug" as const, message: "Applied 3 edits to src/app/globals.css" },
    { level: "info" as const, message: "Theme system implementation complete" },
    { level: "error" as const, message: "Failed to connect to Redis: connection refused" },
    { level: "warn" as const, message: "Falling back to in-memory cache" },
    { level: "info" as const, message: "Running tests with Playwright..." },
    { level: "debug" as const, message: "Test results: 45 passed, 3 failed" },
    { level: "info" as const, message: "Committing changes: feat: add theme toggle" },
    { level: "info" as const, message: "Pushed to origin/main" },
  ];

  // Generate logs with timestamps going back in time
  for (let i = messages.length - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5000);
    logs.push({
      timestamp: timestamp.toISOString().replace("T", " ").slice(0, 19),
      level: messages[i].level,
      message: messages[i].message,
    });
  }

  return logs;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filter = request.nextUrl.searchParams.get("filter") || "all";

  try {
    // Get connection details
    const connection = await getConnection(id);

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // In production, we would fetch actual logs from the instance via proxy
    // For now, return mock logs
    let logs = generateMockLogs();

    // Apply filter
    if (filter !== "all") {
      logs = logs.filter((log) => log.level === filter);
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
