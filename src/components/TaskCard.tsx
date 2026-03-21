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
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500",
  },
  completed: {
    label: "已完成",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
    borderColor: "border-green-500",
  },
  archived: {
    label: "已归档",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-500",
  },
};

const priorityConfig = {
  P1: {
    label: "P1",
    bgColor: "bg-red-500",
    textColor: "text-white",
  },
  P2: {
    label: "P2",
    bgColor: "bg-yellow-500",
    textColor: "text-black",
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
      className={`p-4 rounded-lg border ${status.borderColor} ${status.bgColor} cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]`}
      onClick={() => onClick?.(task.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-white flex-1 pr-2">{task.title}</h3>
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${priority.bgColor} ${priority.textColor}`}
        >
          {priority.label}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
        {onStatusChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextStatus();
            }}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
}
