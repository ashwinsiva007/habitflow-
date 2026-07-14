"use client";

import { useEffect } from "react";

/**
 * useBackHandler — prevents the hardware/browser back button from exiting
 * the app when a modal/overlay is open.
 *
 * How it works:
 * 1. On mount, pushes a dummy history entry so the browser has somewhere
 *    to "go back" to without actually leaving the page.
 * 2. Listens for the "popstate" event (back button pressed).
 * 3. Instead of navigating away, it calls `onBack` (e.g., close the modal).
 *
 * Usage:
 *   useBackHandler(() => setShowModal(false));
 */
export function useBackHandler(onBack: () => void) {
  useEffect(() => {
    // Push a dummy state so back button has something to pop
    history.pushState({ modal: true }, "", location.href);

    const handlePop = () => {
      // Don't navigate — close the modal instead
      onBack();
      // Re-push so repeated back-presses keep working
      history.pushState({ modal: true }, "", location.href);
    };

    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("popstate", handlePop);
      // Clean up: go back once to remove our dummy entry
      history.back();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount/unmount
}
