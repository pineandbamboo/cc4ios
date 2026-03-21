"use client";

import { useState, useEffect } from "react";
import TerminalViewer from "./TerminalViewer";

interface ServerConnection {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "error";
  last_ping?: string;
}

interface InstanceMonitorProps {
  onRefresh?: () => void;
}

export default function InstanceMonitor({ onRefresh }: InstanceMonitorProps) {
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTerminal, setActiveTerminal] = useState<ServerConnection | null>(null);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pingAll = async () => {
    setRefreshing(true);
    for (const conn of connections) {
      try {
        await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: conn.id,
            endpoint: "/health",
            method: "GET",
          }),
        });
      } catch (error) {
        console.error(`Ping failed for ${conn.name}:`, error);
      }
    }
    await fetchConnections();
  };

  useEffect(() => {
    fetchConnections();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case "connected":
        return "在线";
      case "error":
        return "错误";
      default:
        return "离线";
    }
  };

  const connectedCount = connections.filter((c) => c.status === "connected").length;

  if (loading) {
    return (
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)'
        }}
      >
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--card-bg-alt)' }}></div>
            <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'var(--card-bg-alt)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>实例状态</h3>
          <button
            onClick={pingAll}
            disabled={refreshing}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {refreshing ? "刷新中..." : "刷新全部"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {connections.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>总实例</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{connectedCount}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>在线</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--muted)' }}>
              {connections.length - connectedCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>离线</div>
          </div>
        </div>
      </div>

      {/* Instance List */}
      <div className="space-y-2">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="rounded-lg p-3 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusColor(conn.status)} animate-pulse`} />
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                  {conn.name}
                </div>
                <div
                  className="text-xs truncate max-w-[200px]"
                  style={{ color: 'var(--muted)' }}
                >
                  {conn.url}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Terminal button */}
              <button
                onClick={() => setActiveTerminal(conn)}
                disabled={conn.status !== "connected"}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-green-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Open terminal"
              >
                💻
              </button>
              <div className="text-right">
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{statusText(conn.status)}</div>
                {conn.last_ping && (
                  <div className="text-xs" style={{ color: 'var(--muted-alt)' }}>
                    {new Date(conn.last_ping).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Viewer Modal */}
      {activeTerminal && (
        <TerminalViewer
          connectionId={activeTerminal.id}
          connectionName={activeTerminal.name}
          connectionUrl={activeTerminal.url}
          onClose={() => setActiveTerminal(null)}
        />
      )}

      {connections.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-sm">暂无配置的实例</p>
          <p className="text-xs mt-1">在设置页面添加 Claude Code 实例连接</p>
        </div>
      )}
    </div>
  );
}
