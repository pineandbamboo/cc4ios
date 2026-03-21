"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

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
  const { theme } = useTheme();

  const isActive = (path: string) => {
    if (path === "/documents" && pathname === "/") return true;
    return pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 backdrop-blur-lg z-50"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)'
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className="flex flex-col items-center justify-center w-full h-full transition-colors"
            style={{
              color: isActive(tab.path)
                ? 'var(--foreground)'
                : 'var(--muted-alt)'
            }}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
