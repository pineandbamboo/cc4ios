"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface TranslationEditorProps {
  contentZh: string;
  contentEn: string;
  onTranslate?: (text: string, targetLang: "zh" | "en") => Promise<string>;
  onSave?: (contentZh: string, contentEn: string) => void;
}

export default function TranslationEditor({
  contentZh: initialContentZh,
  contentEn: initialContentEn,
  onTranslate,
  onSave,
}: TranslationEditorProps) {
  const [contentZh, setContentZh] = useState(initialContentZh);
  const [contentEn, setContentEn] = useState(initialContentEn);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeSide, setActiveSide] = useState<"zh" | "en">("zh");
  const [syncScroll, setSyncScroll] = useState(true);

  const zhRef = useRef<HTMLTextAreaElement>(null);
  const enRef = useRef<HTMLTextAreaElement>(null);

  // Sync scrolling between editors
  const handleScroll = useCallback((source: "zh" | "en") => {
    if (!syncScroll) return;

    const sourceRef = source === "zh" ? zhRef.current : enRef.current;
    const targetRef = source === "zh" ? enRef.current : zhRef.current;

    if (sourceRef && targetRef) {
      const scrollRatio = sourceRef.scrollTop / (sourceRef.scrollHeight - sourceRef.clientHeight);
      targetRef.scrollTop = scrollRatio * (targetRef.scrollHeight - targetRef.clientHeight);
    }
  }, [syncScroll]);

  const handleTranslateToEn = useCallback(async () => {
    if (!onTranslate || !contentZh) return;

    setIsTranslating(true);
    try {
      const translated = await onTranslate(contentZh, "en");
      setContentEn(translated);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  }, [contentZh, onTranslate]);

  const handleTranslateToZh = useCallback(async () => {
    if (!onTranslate || !contentEn) return;

    setIsTranslating(true);
    try {
      const translated = await onTranslate(contentEn, "zh");
      setContentZh(translated);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  }, [contentEn, onTranslate]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(contentZh, contentEn);
    }
  }, [contentZh, contentEn, onSave]);

  // Split content into paragraphs for parallel editing
  const zhParagraphs = contentZh.split("\n\n");
  const enParagraphs = contentEn.split("\n\n");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSyncScroll(!syncScroll)}
            className={`px-3 py-1 rounded ${syncScroll ? "bg-blue-600" : "bg-gray-700"}`}
          >
            Sync Scroll
          </button>
          <button
            onClick={handleTranslateToEn}
            disabled={isTranslating || !contentZh}
            className="px-3 py-1 rounded bg-purple-600 disabled:opacity-50"
          >
            {isTranslating ? "Translating..." : "ZH → EN"}
          </button>
          <button
            onClick={handleTranslateToZh}
            disabled={isTranslating || !contentEn}
            className="px-3 py-1 rounded bg-purple-600 disabled:opacity-50"
          >
            {isTranslating ? "Translating..." : "EN → ZH"}
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 rounded bg-green-600 hover:bg-green-500"
        >
          Save
        </button>
      </div>

      {/* Parallel editors */}
      <div className="flex-1 flex">
        {/* Chinese side */}
        <div className="flex-1 flex flex-col border-r border-gray-800">
          <div className="p-2 bg-gray-800 text-sm font-bold">中文</div>
          <textarea
            ref={zhRef}
            value={contentZh}
            onChange={(e) => setContentZh(e.target.value)}
            onScroll={() => handleScroll("zh")}
            onFocus={() => setActiveSide("zh")}
            className="flex-1 p-4 bg-transparent resize-none focus:outline-none"
            placeholder="输入中文内容..."
          />
        </div>

        {/* English side */}
        <div className="flex-1 flex flex-col">
          <div className="p-2 bg-gray-800 text-sm font-bold">English</div>
          <textarea
            ref={enRef}
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            onScroll={() => handleScroll("en")}
            onFocus={() => setActiveSide("en")}
            className="flex-1 p-4 bg-transparent resize-none focus:outline-none"
            placeholder="Enter English content..."
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-2 border-t border-gray-800 text-sm text-gray-500">
        <span>ZH: {contentZh.length} chars</span>
        <span>EN: {contentEn.length} chars</span>
        <span>Active: {activeSide.toUpperCase()}</span>
      </div>
    </div>
  );
}
