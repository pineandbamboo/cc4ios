"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

interface ServerConnection {
  id: string;
  name: string;
  url: string;
  auth_token?: string;
  status: "connected" | "disconnected" | "error";
  last_ping?: string;
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    auth_token: "",
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: "", url: "", auth_token: "" });
        setShowAddForm(false);
        fetchConnections();
      }
    } catch (error) {
      console.error("Failed to add connection:", error);
    }
  };

  const handleTestConnection = async (connection: ServerConnection) => {
    setTesting(connection.id);
    setTestResult(null);
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          endpoint: "/health",
          method: "GET",
        }),
      });
      const data = await res.json();
      setTestResult({
        id: connection.id,
        success: res.ok,
        message: res.ok ? "连接成功" : data.error || "连接失败",
      });
    } catch (error) {
      setTestResult({
        id: connection.id,
        success: false,
        message: "连接失败",
      });
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm("确定要删除此连接吗？")) return;
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      fetchConnections();
    } catch (error) {
      console.error("Failed to delete connection:", error);
    }
  };

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

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg z-30 px-4 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">设置</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Server Connections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400">
              Claude Code 实例连接
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-blue-400 text-sm"
            >
              + 添加
            </button>
          </div>

          {/* Connection List */}
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${statusColor(conn.status)}`}
                    />
                    <span className="font-medium">{conn.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{conn.status}</span>
                </div>
                <p className="text-sm text-gray-400 truncate mb-3">{conn.url}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestConnection(conn)}
                    disabled={testing === conn.id}
                    className="flex-1 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testing === conn.id ? "测试中..." : "测试连接"}
                  </button>
                  <button
                    onClick={() => handleDeleteConnection(conn.id)}
                    className="px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                  >
                    删除
                  </button>
                </div>
                {testResult?.id === conn.id && (
                  <p
                    className={`mt-2 text-sm ${
                      testResult.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {testResult.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddConnection}
              className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  连接名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: Mac Studio, EC2 Server"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  服务器地址
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://your-server.ngrok.io"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  认证令牌 (可选)
                </label>
                <input
                  type="password"
                  value={formData.auth_token}
                  onChange={(e) =>
                    setFormData({ ...formData, auth_token: e.target.value })
                  }
                  placeholder="Bearer token"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {loading && (
            <div className="text-center py-4 text-gray-500">加载中...</div>
          )}

          {!loading && connections.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-4">🔗</p>
              <p>暂无服务器连接</p>
              <p className="text-sm mt-2">添加你的 Claude Code 实例连接</p>
            </div>
          )}
        </section>

        {/* App Info */}
        <section className="border-t border-gray-800 pt-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">关于</h2>
          <div className="space-y-2 text-sm text-gray-500">
            <p>CEO Support App v1.0.0</p>
            <p>用于管理 Claude Code 实例任务的移动端界面</p>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
