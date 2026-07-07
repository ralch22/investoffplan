"use client";

import { useEffect } from "react";
import { prefetchCatalogApi } from "@/lib/catalog-browser";

/**
 * CatalogPrefetch
 * Defers the catalog-lite.json (or /api/catalog/lite) preload until the browser is idle
 * using requestIdleCallback (with timeout fallback). This avoids competing with
 * critical path rendering / LCP while ensuring the large catalog slice is ready
 * for interactive pages like /projects and /compare.
 */
export function CatalogPrefetch() {
  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let interacted = false;

    const runPrefetch = () => {
      if (cancelled || interacted) return;
      interacted = true;
      // The underlying fetchCatalogApi already dedupes via singleton promise
      // and swallows its own errors.
      prefetchCatalogApi();
      cleanup();
    };

    const cleanup = () => {
      cancelled = true;
      if (idleHandle != null && typeof (window as any).cancelIdleCallback === "function") {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) clearTimeout(timeoutHandle);
      removeInteractionListeners();
    };

    const onFirstInteraction = () => {
      runPrefetch();
    };

    const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const;
    const addInteractionListeners = () => {
      for (const ev of interactionEvents) {
        window.addEventListener(ev, onFirstInteraction, { once: true, passive: true });
      }
    };
    const removeInteractionListeners = () => {
      for (const ev of interactionEvents) {
        window.removeEventListener(ev, onFirstInteraction);
      }
    };

    if (typeof window === "undefined") return;

    addInteractionListeners();

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(() => runPrefetch(), { timeout: 4000 });
    } else {
      // Fallback for older browsers
      timeoutHandle = setTimeout(() => runPrefetch(), 2000);
    }

    return cleanup;
  }, []);

  return null;
}
