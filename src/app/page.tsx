"use client";

import { useState } from "react";
import VoiceInput from "@/components/VoiceInput";
import DocumentList from "@/components/DocumentList";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "messages" | "support" | "tools" | "profile">("support");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-4">
        {activeTab === "support" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">CEO Support</h1>
            <VoiceInput />
            <DocumentList />
          </div>
        )}
        {activeTab === "home" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">首页</h1>
            <p className="text-gray-400">欢迎使用 CEO Support App</p>
          </div>
        )}
        {activeTab === "messages" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">消息</h1>
            <p className="text-gray-400">暂无新消息</p>
          </div>
        )}
        {activeTab === "tools" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">工具</h1>
            <p className="text-gray-400">AI 编辑工具</p>
          </div>
        )}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">我的</h1>
            <p className="text-gray-400">个人设置</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center w-16 ${activeTab === "home" ? "text-white" : "text-gray-500"}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">首页</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center w-16 ${activeTab === "messages" ? "text-white" : "text-gray-500"}`}
          >
            <span className="text-xl">💬</span>
            <span className="text-xs">消息</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`flex flex-col items-center justify-center w-16 ${activeTab === "support" ? "bg-red-600 rounded-lg" : "text-gray-500"}`}
          >
            <span className="text-xl">🎯</span>
            <span className="text-xs">CEO支持</span>
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex flex-col items-center justify-center w-16 ${activeTab === "tools" ? "text-white" : "text-gray-500"}`}
          >
            <span className="text-xl">🔧</span>
            <span className="text-xs">工具</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center w-16 ${activeTab === "profile" ? "text-white" : "text-gray-500"}`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
