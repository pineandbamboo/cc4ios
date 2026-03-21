"use client";

import { useState } from "react";

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for initial development
const mockDocuments: Document[] = [
  {
    id: "1",
    title: "产品路线图",
    content: "## Q2 目标\n- 完成语音输入功能\n- 集成 AI 编辑",
    createdAt: new Date("2026-03-20"),
    updatedAt: new Date("2026-03-20"),
  },
  {
    id: "2",
    title: "Meeting Notes",
    content: "## Action Items\n- Review PR\n- Update docs",
    createdAt: new Date("2026-03-19"),
    updatedAt: new Date("2026-03-19"),
  },
];

export default function DocumentList() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>文档列表</h2>
        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors">
          + 新建
        </button>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedId(doc.id)}
            className="w-full text-left p-4 rounded-lg transition-all"
            style={{
              backgroundColor: selectedId === doc.id
                ? 'rgba(59, 130, 246, 0.15)'
                : 'var(--card-bg)',
              border: `1px solid ${selectedId === doc.id ? '#3b82f6' : 'var(--card-border)'}`
            }}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {doc.title}
              </h3>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {formatDate(doc.updatedAt)}
              </span>
            </div>
            <p className="text-sm truncate mt-1" style={{ color: 'var(--muted)' }}>
              {doc.content.slice(0, 50)}...
            </p>
          </button>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p>暂无文档</p>
          <p className="text-sm mt-1">使用语音输入创建第一个文档</p>
        </div>
      )}
    </div>
  );
}
