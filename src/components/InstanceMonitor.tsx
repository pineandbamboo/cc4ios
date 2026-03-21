"use client";

import { useState, useEffect } from "react";

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
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">实例状态</h3>
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
            <div className="text-2xl font-bold text-white">{connections.length}</div>
            <div className="text-xs text-gray-500">总实例</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{connectedCount}</div>
            <div className="text-xs text-gray-500">在线</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {connections.length - connectedCount}
            </div>
            <div className="text-xs text-gray-500">离线</div>
          </div>
        </div>
      </div>

      {/* Instance List */}
      <div className="space-y-2">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusColor(conn.status)} animate-pulse`} />
              <div>
                <div className="font-medium text-white text-sm">{conn.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                  {conn.url}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">{statusText(conn.status)}</div>
              {conn.last_ping && (
                <div className="text-xs text-gray-600">
                  {new Date(conn.last_ping).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {connections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-sm">暂无配置的实例</p>
          <p className="text-xs mt-1">在设置页面添加 Claude Code 实例连接</p>
        </div>
      )}
    </div>
  );
}
