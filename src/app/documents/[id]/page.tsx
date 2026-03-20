"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import AIEditPanel from "@/components/AIEditPanel";
import TranslationEditor from "@/components/TranslationEditor";
import MindMapView from "@/components/MindMapView";
import { formatTypography } from "@/lib/formatting/typography";

type ViewMode = "edit" | "translate" | "mindmap";

interface Document {
  id: string;
  title: string;
  content_zh: string | null;
  content_en: string | null;
  status: string;
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${docId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocument(data.document);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  const handleSave = useCallback(async (content: string) => {
    if (!document) return;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_zh: content }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [document, docId]);

  const handleAIEdit = useCallback(async (instruction: string) => {
    if (!document?.content_zh) return "";

    const response = await fetch("/api/ai/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: document.content_zh,
        instruction,
      }),
    });

    const data = await response.json();
    return data.content;
  }, [document?.content_zh]);

  const handleTranslate = useCallback(async (text: string, targetLang: "zh" | "en") => {
    const response = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, targetLang }),
    });

    const data = await response.json();
    return data.content;
  }, []);

  const handleSaveTranslation = useCallback(async (contentZh: string, contentEn: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_zh: contentZh, content_en: contentEn }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (err) {
      console.error("Save translation error:", err);
    }
  }, [docId]);

  const handleGenerateMindMap = useCallback(async () => {
    // This would call the mind map API
    console.log("Generating mind map...");
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-400 mb-4">{error || "Document not found"}</div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">{document.title}</h1>
          <span className="px-2 py-1 text-xs rounded bg-gray-700">{document.status}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          {(["edit", "translate", "mindmap"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded ${
                viewMode === mode ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}

          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`px-4 py-2 rounded ${
              showAIPanel ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            AI Panel
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "edit" && (
            <DocumentEditor
              initialContent={document.content_zh || ""}
              onSave={handleSave}
              onAIEdit={(instruction) => {
                setShowAIPanel(true);
                return Promise.resolve();
              }}
            />
          )}

          {viewMode === "translate" && (
            <TranslationEditor
              contentZh={document.content_zh || ""}
              contentEn={document.content_en || ""}
              onTranslate={handleTranslate}
              onSave={handleSaveTranslation}
            />
          )}

          {viewMode === "mindmap" && (
            <MindMapView onGenerate={handleGenerateMindMap} />
          )}
        </div>

        {/* AI Panel (side panel) */}
        {showAIPanel && (
          <div className="w-96 border-l border-gray-800">
            <AIEditPanel
              originalContent={document.content_zh || ""}
              onSubmitInstruction={handleAIEdit}
              onAccept={(content) => {
                handleSave(content);
                setShowAIPanel(false);
              }}
              onReject={() => setShowAIPanel(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
