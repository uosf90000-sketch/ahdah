"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ChatLive() {
  const router = useRouter();

  useEffect(() => {
    document.getElementById("chat-latest")?.scrollIntoView({ block: "end" });
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}

