"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import RecordingBar from "@/components/RecordingBar";
import TaskCard, { Task } from "@/components/TaskCard";
import DocumentList from "@/components/DocumentList";
import InstanceMonitor from "@/components/InstanceMonitor";

export default function DocumentsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordingBar, setShowRecordingBar] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks?category=documents");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleTranscript = async (text: string) => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: text.slice(0, 50),
          description: text,
          category: "documents",
        }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div
        className="sticky top-0 backdrop-blur-lg z-30 px-4 py-4"
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)'
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">文档</h1>
          <button
            onClick={() => setShowRecordingBar(true)}
            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            🎤
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>进行中</h2>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>已完成</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}

        {/* Instance Monitor */}
        <section>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>实例监控</h2>
          <InstanceMonitor />
        </section>

        {/* Documents List */}
        <section>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>文档列表</h2>
          <DocumentList />
        </section>

        {/* Empty state */}
        {loading && (
          <div className="text-center py-8" style={{ color: 'var(--muted)' }}>加载中...</div>
        )}
      </div>

      <RecordingBar visible={showRecordingBar} onTranscript={handleTranscript} />
      <BottomNav />
    </main>
  );
}
