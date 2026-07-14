"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseSwipeNavOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal distance in px to trigger swipe (default: 60) */
  threshold?: number;
  /** Max vertical drift allowed (default: 80) — prevents triggering on vertical scroll */
  verticalThreshold?: number;
}

export function useSwipeNav({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  verticalThreshold = 80,
}: UseSwipeNavOptions) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const dt = Date.now() - startTime.current;

      // Ignore slow or too-vertical swipes
      if (Math.abs(dy) > verticalThreshold) return;
      if (Math.abs(dx) < threshold) return;
      if (dt > 600) return; // must be a quick flick

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, verticalThreshold]
  );

  return { handleTouchStart, handleTouchEnd };
}
