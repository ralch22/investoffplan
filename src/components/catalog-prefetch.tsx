"use client";

import { useEffect } from "react";
import { prefetchCatalogApi, prefetchSuggestIndex } from "@/lib/catalog-browser";

/**
 * CatalogPrefetch
 * Warms the search data at browser idle, smallest-first:
 *  1. the suggest index (~tiny) — so the first keystroke in any search box
 *     matches against an already-loaded index, and
 *  2. the full catalog slice a few seconds later — for /projects, /compare and
 *     smart-query result counts.
 * Deliberately NOT triggered by first interaction: kicking a multi-MB download
 * + parse at the exact moment the user shows intent is what made search feel
 * frozen. requestIdleCallback (with timeout fallback) keeps both fetches off
 * the critical rendering path / LCP.
 */
export function CatalogPrefetch() {
  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | null = null;
    let startHandle: ReturnType<typeof setTimeout> | null = null;
    let fullHandle: ReturnType<typeof setTimeout> | null = null;

    // Both prefetchers dedupe via singleton promises and swallow errors.
    const warm = () => {
      if (cancelled) return;
      prefetchSuggestIndex();
      fullHandle = setTimeout(() => {
        if (!cancelled) prefetchCatalogApi();
      }, 5000);
    };

    if (typeof window === "undefined") return;

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(() => warm(), { timeout: 3000 });
    } else {
      // Fallback for older browsers
      startHandle = setTimeout(warm, 1500);
    }

    return () => {
      cancelled = true;
      if (idleHandle != null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleHandle);
      }
      if (startHandle) clearTimeout(startHandle);
      if (fullHandle) clearTimeout(fullHandle);
    };
  }, []);

  return null;
}
