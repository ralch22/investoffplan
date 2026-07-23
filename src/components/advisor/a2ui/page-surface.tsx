"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import type { A2uiMessage } from "@/lib/advisor/a2ui/messages";

// Client-only, for two reasons. The A2UI renderer subscribes with
// `useSyncExternalStore` and ships no `getServerSnapshot`, so server-rendering
// it breaks prerendering outright — and these surfaces are enhancements over
// page content that is already fully server-rendered, so there is nothing to
// gain from SSR-ing them. The `ssr: false` lives here rather than at the call
// site because a Server Component isn't allowed to pass it.
const AdvisorA2uiSurface = dynamic(
  () => import("./surface").then((m) => m.AdvisorA2uiSurface),
  { ssr: false },
);

/**
 * Page-level host for a composed A2UI surface.
 *
 * The chat drawer owns its own lead state; a surface mounted *in a page* has no
 * chat around it, so this wrapper supplies the same handler contract locally.
 * Everything else — catalog, renderer, error boundary, legacy fallback — is the
 * widget's `AdvisorA2uiSurface`, reused unchanged.
 *
 * `fallback` is what renders if the surface throws: callers pass the markup the
 * page would have shown anyway, so a broken surface is invisible to the user.
 */
export function PageA2uiSurface({
  messages,
  fallback = null,
  onLeadSubmitted,
}: {
  messages: A2uiMessage[];
  fallback?: ReactNode;
  /** Optional hook for page-specific analytics/UI after a lead is captured. */
  onLeadSubmitted?: () => void;
}) {
  const [leadDone, setLeadDone] = useState(false);

  return (
    <AdvisorA2uiSurface
      messages={messages}
      handlers={{
        leadDone,
        onLeadSubmitted: () => {
          setLeadDone(true);
          onLeadSubmitted?.();
        },
      }}
      fallback={fallback}
    />
  );
}
