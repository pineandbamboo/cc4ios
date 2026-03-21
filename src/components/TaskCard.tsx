"use client";

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

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: string, status: Task["status"]) => void;
  onClick?: (id: string) => void;
}

const statusConfig = {
  in_progress: {
    label: "进行中",
    bgColor: "rgba(59, 130, 246, 0.15)",
    textColor: "#60a5fa",
    borderColor: "#3b82f6",
  },
  completed: {
    label: "已完成",
    bgColor: "rgba(34, 197, 94, 0.15)",
    textColor: "#4ade80",
    borderColor: "#22c55e",
  },
  archived: {
    label: "已归档",
    bgColor: "rgba(107, 114, 128, 0.15)",
    textColor: "#9ca3af",
    borderColor: "#6b7280",
  },
};

const priorityConfig = {
  P1: {
    label: "P1",
    bgColor: "#ef4444",
    textColor: "#ffffff",
  },
  P2: {
    label: "P2",
    bgColor: "#eab308",
    textColor: "#000000",
  },
};

export default function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  const handleNextStatus = () => {
    if (!onStatusChange) return;
    const nextStatus: Task["status"] =
      task.status === "in_progress"
        ? "completed"
        : task.status === "completed"
        ? "archived"
        : "in_progress";
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div
      className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        border: `1px solid ${status.borderColor}`,
        backgroundColor: status.bgColor,
      }}
      onClick={() => onClick?.(task.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium flex-1 pr-2" style={{ color: 'var(--foreground)' }}>
          {task.title}
        </h3>
        <span
          className="px-2 py-0.5 rounded text-xs font-bold"
          style={{
            backgroundColor: priority.bgColor,
            color: priority.textColor,
          }}
        >
          {priority.label}
        </span>
      </div>
      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--muted)' }}>
        {task.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: status.textColor }}>
          {status.label}
        </span>
        {onStatusChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextStatus();
            }}
            className="text-xs transition-colors"
            style={{ color: 'var(--muted-alt)' }}
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
}
