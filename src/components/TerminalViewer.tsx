"use client";

import { useState, useEffect, useRef } from "react";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

interface TerminalViewerProps {
  connectionId: string;
  connectionName: string;
  connectionUrl: string;
  onClose: () => void;
}

export default function TerminalViewer({
  connectionId,
  connectionName,
  connectionUrl,
  onClose,
}: TerminalViewerProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Add initial connection message
  useEffect(() => {
    addLine("system", `Connecting to ${connectionName}...`);
    addLine("system", `URL: ${connectionUrl}`);

    // Try to connect
    testConnection();
  }, [connectionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const testConnection = async () => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          endpoint: "/health",
          method: "GET",
        }),
      });

      if (res.ok) {
        setIsConnected(true);
        addLine("system", "✓ Connected successfully");
        addLine("system", "Type 'help' for available commands");
      } else {
        addLine("error", "✗ Connection failed: " + res.statusText);
      }
    } catch (err) {
      addLine("error", "✗ Connection failed: " + String(err));
    }
  };

  const addLine = (type: TerminalLine["type"], content: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    // Show input
    addLine("input", `$ ${cmd}`);
    setInput("");
    setIsProcessing(true);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/connections/${connectionId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLine("error", data.error || `HTTP ${res.status}: ${res.statusText}`);
      } else if (data.output) {
        addLine("output", data.output);
      } else if (data.error) {
        addLine("error", data.error);
      } else {
        addLine("output", JSON.stringify(data, null, 2));
      }
    } catch (err) {
      addLine("error", `Error: ${String(err)}`);
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      executeCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const startVoiceInput = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addLine("error", "语音识别不支持此浏览器");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "zh-CN";

    recognition.onstart = () => {
      setIsRecording(true);
      addLine("system", "🎤 Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      addLine("error", `Voice error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "input":
        return "text-cyan-400";
      case "output":
        return "text-gray-200";
      case "error":
        return "text-red-400";
      case "system":
        return "text-yellow-500";
      default:
        return "text-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-xl">💻</span>
          <div>
            <span className="font-mono text-sm text-white">{connectionName}</span>
            <span className={`ml-2 text-xs ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "● Connected" : "○ Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLines([])}
            className="text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-500"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div key={line.id} className={`${typeColor(line.type)} whitespace-pre-wrap break-all`}>
            {line.content}
          </div>
        ))}
        {isProcessing && (
          <div className="text-gray-500 animate-pulse">
            {isLoading ? "Executing..." : "Processing..."}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder-gray-600 disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={startVoiceInput}
            disabled={isRecording || isProcessing}
            className={`px-3 py-1.5 rounded text-sm ${
              isRecording
                ? "bg-red-600 animate-pulse"
                : "bg-gray-800 hover:bg-gray-700"
            } text-white`}
          >
            {isRecording ? "🎤..." : "🎤"}
          </button>
          <button
            onClick={() => executeCommand(input)}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          ↑↓ for history • Enter to send • Esc to close • 🎤 for voice input
        </div>
      </div>
    </div>
  );
}
