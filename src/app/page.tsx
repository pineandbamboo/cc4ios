"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to documents page
    router.replace("/documents");
  }, [router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <p style={{ color: 'var(--muted)' }}>Loading...</p>
    </main>
  );
}
