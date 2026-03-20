"use client";

import { useState, useCallback, useEffect } from "react";

interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
  collapsed?: boolean;
}

interface MindMapViewProps {
  data?: {
    title: string;
    children: MindMapNode[];
  };
  onNodeClick?: (nodeId: string) => void;
  onGenerate?: () => Promise<void>;
}

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Color palette for nodes
const colors = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-cyan-600",
];

export default function MindMapView({ data, onNodeClick, onGenerate }: MindMapViewProps) {
  const [mindMap, setMindMap] = useState(data);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!onGenerate) return;
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerate]);

  const toggleNode = useCallback((nodeId: string) => {
    const toggle = (nodes: MindMapNode[]): MindMapNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, collapsed: !node.collapsed };
        }
        if (node.children) {
          return { ...node, children: toggle(node.children) };
        }
        return node;
      });
    };

    setMindMap((prev) =>
      prev
        ? {
            ...prev,
            children: toggle(prev.children),
          }
        : prev
    );
  }, []);

  const renderNode = (node: MindMapNode, depth: number = 0, index: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const colorClass = colors[depth % colors.length];

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
            ${colorClass} ${selectedNode === node.id ? "ring-2 ring-white" : ""}
            hover:opacity-80 transition-opacity
          `}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            setSelectedNode(node.id);
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (onNodeClick) {
              onNodeClick(node.id);
            }
          }}
        >
          {hasChildren && (
            <span className="text-xs">{node.collapsed ? "▶" : "▼"}</span>
          )}
          <span className="text-sm">{node.text}</span>
          {hasChildren && (
            <span className="text-xs opacity-60">({node.children!.length})</span>
          )}
        </div>

        {hasChildren && !node.collapsed && (
          <div className="flex flex-col mt-1 space-y-1">
            {node.children!.map((child, i) => renderNode(child, depth + 1, i))}
          </div>
        )}
      </div>
    );
  };

  if (!mindMap) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="mb-4">No mind map generated yet</p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !onGenerate}
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate Mind Map"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !onGenerate}
          className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
        >
          {isGenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {/* Mind map content */}
      <div
        className="flex-1 overflow-auto p-4"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
      >
        {/* Root node */}
        <div className="mb-4">
          <div className="inline-block px-4 py-2 text-lg font-bold bg-gray-700 rounded-lg">
            {mindMap.title}
          </div>
        </div>

        {/* Child nodes */}
        <div className="space-y-2">
          {mindMap.children.map((node, i) => renderNode(node, 0, i))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-2 border-t border-gray-800 text-sm text-gray-500">
        <span>Nodes: {mindMap.children.length}</span>
        <span>Selected: {selectedNode || "None"}</span>
      </div>
    </div>
  );
}
