"use client";

import { useEffect, useRef } from "react";

/**
 * useBackHandler — intercepts the hardware/browser back button ONLY when
 * a modal/overlay is actually open, so it never interferes with page navigation.
 *
 * @param onBack  Callback to run when back is pressed (e.g. close the modal)
 * @param isOpen  Pass true when the modal is visible; false otherwise.
 *                When false the handler is a no-op and does NOT push any
 *                history state, so normal navigation is completely unaffected.
 */
export function useBackHandler(onBack: () => void, isOpen: boolean = true) {
  // Keep a stable ref so the popstate listener always sees the latest callback
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  useEffect(() => {
    // Only intercept when the overlay is actually showing
    if (!isOpen) return;

    // Push one dummy entry — now pressing back pops THIS entry instead of leaving the page
    history.pushState({ habitflowModal: true }, "", location.href);

    const handlePop = () => {
      onBackRef.current();
      // Re-push so the NEXT back-press is also caught
      history.pushState({ habitflowModal: true }, "", location.href);
    };

    window.addEventListener("popstate", handlePop);

    return () => {
      // IMPORTANT: Do NOT call history.back() here.
      // Calling history.back() during cleanup (which happens on page navigation)
      // would reverse the navigation the user just triggered.
      window.removeEventListener("popstate", handlePop);
    };
  }, [isOpen]);
}
