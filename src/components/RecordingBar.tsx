"use client";

import { useState, useRef, useEffect } from "react";

interface RecordingBarProps {
  onTranscript?: (text: string) => void;
  visible?: boolean;
}

// Type for SpeechRecognition with event handlers
interface SpeechRecognitionWithEvents extends SpeechRecognition {
  onstart: ((this: SpeechRecognition) => void) | null;
  onend: ((this: SpeechRecognition) => void) | null;
  onresult: ((this: SpeechRecognition, event: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, event: SpeechRecognitionErrorEvent) => void) | null;
  onspeechstart: ((this: SpeechRecognition) => void) | null;
}

export default function RecordingBar({ onTranscript, visible = false }: RecordingBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!visible);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognitionWithEvents | null>(null);

  // Sync visible prop with internal state
  useEffect(() => {
    if (visible) {
      setIsMinimized(false);
    }
  }, [visible]);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setError("麦克风权限被拒绝，请在浏览器设置中允许访问麦克风");
      return false;
    }
  };

  const startRecording = async () => {
    if (typeof window === "undefined") return;

    setError(null);

    // Check support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari 浏览器。");
      setIsSupported(false);
      return;
    }

    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      const recognition = new SpeechRecognition() as SpeechRecognitionWithEvents;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        let errorMessage = "语音识别出错";
        switch (event.error) {
          case "not-allowed":
            errorMessage = "麦克风权限被拒绝";
            break;
          case "no-speech":
            errorMessage = "未检测到语音，请重试";
            break;
          case "network":
            errorMessage = "网络错误，请检查网络连接";
            break;
          case "audio-capture":
            errorMessage = "无法捕获音频，请检查麦克风";
            break;
          case "aborted":
            errorMessage = "录音被中断";
            break;
        }
        setError(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
      };

      // iOS Safari requires this
      recognition.onspeechstart = () => {
        console.log("Speech detected");
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsMinimized(false);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("启动语音识别失败，请重试");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (transcript.trim() && onTranscript) {
      onTranscript(transcript.trim());
      setTranscript("");
      setIsMinimized(true);
      setError(null);
    }
  };

  const handleCancel = () => {
    stopRecording();
    setTranscript("");
    setIsMinimized(true);
    setError(null);
  };

  // Show unsupported message
  if (isSupported === false) {
    return (
      <div
        className="fixed bottom-20 left-4 right-4 rounded-2xl p-4 shadow-xl z-40"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium">您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari 浏览器。</p>
          </div>
        </div>
        <button
          onClick={() => setIsSupported(null)}
          className="w-full py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--card-bg-alt)',
            color: 'var(--foreground)'
          }}
        >
          关闭
        </button>
      </div>
    );
  }

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
    <div
      className="fixed bottom-20 left-4 right-4 rounded-2xl p-4 shadow-xl z-40"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)'
      }}
    >
      {/* Recording indicator */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"
          }`}
        />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {isRecording ? "正在录音..." : "点击麦克风开始"}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Transcript preview */}
      {transcript && (
        <div
          className="rounded-lg p-3 mb-3 max-h-32 overflow-y-auto"
          style={{ backgroundColor: 'var(--card-bg-alt)' }}
        >
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            isRecording
              ? "bg-red-600 hover:bg-red-500 text-white"
              : ""
          }`}
          style={!isRecording ? {
            backgroundColor: 'var(--card-bg-alt)',
            color: 'var(--foreground)'
          } : undefined}
        >
          {isRecording ? "⏹ 停止" : "🎤 录音"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!transcript.trim()}
          className="flex-1 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          提交
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-3 rounded-xl font-medium transition-colors"
          style={{
            backgroundColor: 'var(--card-bg-alt)',
            color: 'var(--foreground)'
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
