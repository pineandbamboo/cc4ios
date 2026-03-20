"use client";

import { useState, useCallback, useEffect } from "react";
import { formatTypography, needsTypographyFormatting } from "@/lib/formatting/typography";

interface DocumentEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onAIEdit?: (instruction: string) => void;
}

export default function DocumentEditor({
  initialContent = "",
  onSave,
  onAIEdit,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showTypographyHint, setShowTypographyHint] = useState(false);

  useEffect(() => {
    setShowTypographyHint(needsTypographyFormatting(content));
  }, [content]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(content);
      setIsDirty(false);
    }
  }, [content, onSave]);

  const handleFormatTypography = useCallback(() => {
    setContent((prev) => formatTypography(prev));
    setIsDirty(true);
  }, []);

  const handleAIEdit = useCallback(() => {
    const instruction = prompt("Enter editing instruction:");
    if (instruction && onAIEdit) {
      onAIEdit(instruction);
    }
  }, [onAIEdit]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (isDirty && onSave) {
      // Debounce auto-save
      setTimeout(() => {
        onSave(content);
        setIsDirty(false);
      }, 1000);
    }
  }, [isDirty, content, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`px-3 py-1 rounded ${preview ? "bg-blue-600" : "bg-gray-700"}`}
          >
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleFormatTypography}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
            title="Format typography (add spaces between Chinese/English)"
          >
            Format
          </button>
          <button
            onClick={handleAIEdit}
            className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500"
          >
            AI Edit
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showTypographyHint && (
            <span className="text-yellow-500 text-sm">Typography needed</span>
          )}
          {isDirty && <span className="text-gray-500 text-sm">Unsaved</span>}
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded bg-green-600 hover:bg-green-500"
          >
            Save ⌘S
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex">
        {preview ? (
          <div className="flex-1 p-4 overflow-auto">
            <div className="prose prose-invert max-w-none">
              {content.split("\n").map((line, i) => (
                <p key={i}>{line || "\u00A0"}</p>
              ))}
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            className="flex-1 p-4 bg-transparent resize-none focus:outline-none font-mono"
            placeholder="Start typing or use voice input..."
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-2 border-t border-gray-800 text-sm text-gray-500">
        <span>{content.length} characters</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}
