"use client";

import { useEffect } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

/**
 * Fires a pdp_section_view GA event the first time each section scrolls into
 * view (40% visible). One shared IntersectionObserver, Set-based dedupe so a
 * section fires at most once per mount. Renders nothing.
 */
export function SectionViewTracker({ sections }: { sections: string[] }) {
  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (seen.has(id)) continue;
          seen.add(id);
          trackEvent(ANALYTICS_EVENTS.PDP_SECTION_VIEW, { section_id: id });
        }
      },
      { threshold: 0.4 },
    );
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
