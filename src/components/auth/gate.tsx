"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/client";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { openSignInModal, type GateContext } from "./sign-in-modal-bus";

/**
 * Freemium interaction gate. SEO-critical invariant: gates ACTIONS only —
 * never pre-rendered content. The static HTML is identical for everyone;
 * the session is resolved exclusively client-side (useSession), and the only
 * thing a gate ever does is intercept a click/fetch and open the sign-in
 * modal with contextual copy. If the user signs in while the page is still
 * mounted, the intended action auto-resumes.
 */
export function useGate(context: GateContext): {
  allowed: boolean;
  /** Run `onAllowed` if signed in; otherwise prompt sign-in and resume after. */
  request: (onAllowed?: () => void) => boolean;
} {
  const { data: session } = useSession();
  const allowed = Boolean(session?.user);
  const pendingRef = useRef<(() => void) | null>(null);

  // Session flipped to signed-in with an action parked from before the
  // prompt — auto-invoke it once (magic-link/social sign-in resolved in-page).
  useEffect(() => {
    if (!allowed || !pendingRef.current) return;
    const action = pendingRef.current;
    pendingRef.current = null;
    action();
  }, [allowed]);

  const request = useCallback(
    (onAllowed?: () => void): boolean => {
      if (allowed) {
        onAllowed?.();
        return true;
      }
      pendingRef.current = onAllowed ?? null;
      trackEvent(ANALYTICS_EVENTS.GATE_PROMPT, { context });
      openSignInModal({ context });
      return false;
    },
    [allowed, context],
  );

  return { allowed, request };
}

interface GateProps {
  context: GateContext;
  /** The gated action — runs on activation when signed in (or after sign-in). */
  onAllowed?: () => void;
  children: React.ReactNode;
}

/**
 * Declarative wrapper: renders children unchanged (display: contents — no
 * layout impact, static HTML identical for all users) and intercepts click
 * activation when there is no session.
 */
export function Gate({ context, onAllowed, children }: GateProps) {
  const { allowed, request } = useGate(context);

  return (
    <span
      className="contents"
      onClickCapture={(e) => {
        if (allowed) {
          onAllowed?.();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        request(onAllowed);
      }}
    >
      {children}
    </span>
  );
}
