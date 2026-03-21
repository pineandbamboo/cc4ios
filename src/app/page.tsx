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
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </main>
  );
}
