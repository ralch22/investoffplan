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

    const runPrefetch = () => {
      if (cancelled) return;
      // The underlying fetchCatalogApi already dedupes via singleton promise
      // and swallows its own errors.
      prefetchCatalogApi();
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
      const handle = win.requestIdleCallback(runPrefetch, { timeout: 4000 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(handle);
      };
    }

    // Fallback for older browsers
    const timeout = setTimeout(runPrefetch, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
