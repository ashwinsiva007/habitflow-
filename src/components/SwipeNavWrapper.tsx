"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSwipeNav } from "@/hooks/useSwipeNav";

// Tab order — matches the navbar order exactly
const TABS = ["/dashboard", "/habits", "/progress", "/notes", "/profile"];

export default function SwipeNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = TABS.findIndex((t) => pathname.startsWith(t));

  const goLeft = () => {
    // Swipe LEFT → next tab (towards right in nav)
    if (currentIndex < TABS.length - 1) {
      router.push(TABS[currentIndex + 1]);
    }
  };

  const goRight = () => {
    // Swipe RIGHT → previous tab (towards left in nav)
    if (currentIndex > 0) {
      router.push(TABS[currentIndex - 1]);
    }
  };

  const { handleTouchStart, handleTouchEnd } = useSwipeNav({
    onSwipeLeft: goLeft,
    onSwipeRight: goRight,
    threshold: 55,
    verticalThreshold: 75,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Only attach on pages that are in the tab list
    if (currentIndex === -1) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, currentIndex]);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
