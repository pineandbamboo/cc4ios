"use client";

import { usePathname, useRouter } from "next/navigation";

interface Tab {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const tabs: Tab[] = [
  { id: "documents", label: "文档", icon: "📄", path: "/documents" },
  { id: "meetings", label: "会议", icon: "📅", path: "/meetings" },
  { id: "talent", label: "人才", icon: "👥", path: "/talent" },
  { id: "email", label: "邮件", icon: "✉️", path: "/email" },
  { id: "settings", label: "设置", icon: "⚙️", path: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/documents" && pathname === "/") return true;
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive(tab.path) ? "text-white" : "text-gray-500"
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
