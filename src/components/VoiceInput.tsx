"use client";

import { useState, useCallback, useEffect } from "react";

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check for Web Speech API support on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript((prev) => prev + finalTranscript + interimTranscript);

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  // Show loading state while checking support
  if (isSupported === null) {
    return (
      <div className="p-4">
        <p className="text-gray-400">检查语音识别支持...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-800">
        <p className="text-yellow-400">您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari 浏览器。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all ${
            isRecording
              ? "bg-red-600 animate-pulse"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          🎤
        </button>
        <div>
          <p className="font-medium">
            {isRecording ? "正在录音..." : "点击开始录音"}
          </p>
          <p className="text-sm text-gray-400">
            支持中英文混合识别
          </p>
        </div>
      </div>

      {transcript && (
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">识别结果</span>
            <button
              onClick={clearTranscript}
              className="text-sm text-red-400 hover:text-red-300"
            >
              清除
            </button>
          </div>
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
}
