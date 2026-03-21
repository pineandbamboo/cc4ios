"use client";

import { useState, useRef } from "react";

interface RecordingBarProps {
  onTranscript?: (text: string) => void;
  visible?: boolean;
}

export default function RecordingBar({ onTranscript, visible = false }: RecordingBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!visible);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setIsMinimized(false);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (transcript.trim() && onTranscript) {
      onTranscript(transcript.trim());
      setTranscript("");
      setIsMinimized(true);
    }
  };

  const handleCancel = () => {
    stopRecording();
    setTranscript("");
    setIsMinimized(true);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg z-40 hover:bg-red-500 transition-colors"
      >
        <span className="text-2xl">🎤</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gray-900 rounded-2xl p-4 shadow-xl z-40 border border-gray-700">
      {/* Recording indicator */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"
          }`}
        />
        <span className="text-sm text-gray-400">
          {isRecording ? "正在录音..." : "点击麦克风开始"}
        </span>
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div className="bg-gray-800 rounded-lg p-3 mb-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-white">{transcript}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            isRecording
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          {isRecording ? "⏹ 停止" : "🎤 录音"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!transcript.trim()}
          className="flex-1 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
        >
          提交
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-3 rounded-xl font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
