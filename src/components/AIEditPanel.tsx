"use client";

import { useState, useCallback } from "react";

interface AIEditPanelProps {
  originalContent: string;
  editedContent?: string;
  onAccept?: (content: string) => void;
  onReject?: () => void;
  onSubmitInstruction: (instruction: string) => Promise<string>;
}

export default function AIEditPanel({
  originalContent,
  editedContent: initialEditedContent,
  onAccept,
  onReject,
  onSubmitInstruction,
}: AIEditPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [editedContent, setEditedContent] = useState(initialEditedContent || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(!!initialEditedContent);

  const handleSubmit = useCallback(async () => {
    if (!instruction.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onSubmitInstruction(instruction);
      setEditedContent(result);
      setShowDiff(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit document");
    } finally {
      setIsLoading(false);
    }
  }, [instruction, onSubmitInstruction]);

  const handleAccept = useCallback(() => {
    if (onAccept && editedContent) {
      onAccept(editedContent);
      setInstruction("");
      setEditedContent("");
      setShowDiff(false);
    }
  }, [editedContent, onAccept]);

  const handleReject = useCallback(() => {
    setEditedContent("");
    setShowDiff(false);
    if (onReject) {
      onReject();
    }
  }, [onReject]);

  // Simple diff view - highlight changes
  const renderDiff = () => {
    if (!showDiff || !editedContent) return null;

    const originalLines = originalContent.split("\n");
    const editedLines = editedContent.split("\n");

    return (
      <div className="flex-1 overflow-auto p-4 space-y-2">
        <h3 className="font-bold text-lg mb-4">Review Changes</h3>
        {editedLines.map((line, i) => {
          const originalLine = originalLines[i] || "";
          const isChanged = line !== originalLine;

          return (
            <div
              key={i}
              className={`p-2 rounded ${isChanged ? "bg-green-900/30 border-l-2 border-green-500" : ""}`}
            >
              {isChanged && (
                <div className="text-red-500 line-through text-sm mb-1">{originalLine}</div>
              )}
              <div className={isChanged ? "text-green-400" : ""}>{line}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-bold">AI Edit</h2>
      </div>

      {/* Instruction input */}
      <div className="p-4 border-b border-gray-800">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Describe how you want to edit the document..."
          className="w-full p-2 bg-gray-800 rounded resize-none h-24"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !instruction.trim()}
          className="mt-2 w-full px-4 py-2 bg-purple-600 rounded hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Apply Edit"}
        </button>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </div>

      {/* Diff view */}
      {showDiff && renderDiff()}

      {/* Accept/Reject buttons */}
      {showDiff && (
        <div className="p-4 border-t border-gray-800 flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2 bg-red-600 rounded hover:bg-red-500"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-green-600 rounded hover:bg-green-500"
          >
            Accept
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="p-4 border-t border-gray-800">
        <h3 className="text-sm font-bold mb-2 text-gray-400">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Fix grammar",
            "Improve clarity",
            "Make more concise",
            "Expand details",
            "Change tone to formal",
          ].map((action) => (
            <button
              key={action}
              onClick={() => setInstruction(action)}
              className="px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
