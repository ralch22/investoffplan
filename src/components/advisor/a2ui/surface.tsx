"use client";

import { Component, useEffect, useMemo, type ReactNode } from "react";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import type { SurfaceModel } from "@a2ui/web_core/v0_9";
import { A2uiSurface } from "@a2ui/react/v0_9";
import type { ReactComponentImplementation } from "@a2ui/react/v0_9";
import type { A2uiMessage } from "@/lib/advisor/a2ui/messages";
import { advisorCatalog } from "./catalog";
import { AdvisorA2uiContext, type AdvisorA2uiHandlers } from "./context";

/**
 * Wraps one assistant turn's A2UI surface. If anything in the renderer throws
 * (unknown component, malformed message, binder error), we fall back to the
 * `fallback` node — the widget passes the always-present legacy `cards` view —
 * so a bad surface degrades gracefully instead of blanking the chat.
 */
class SurfaceErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(
      "advisor_a2ui_render_error",
      error instanceof Error ? error.message : String(error),
    );
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function A2uiRenderer({ messages }: { messages: A2uiMessage[] }) {
  // Build + process synchronously during render so an invalid message throws
  // INTO the boundary above (a throw from useEffect would escape it).
  const { surface, processor } = useMemo(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [advisorCatalog],
      undefined,
      { version: "v0.9" },
    );
    processor.processMessages(messages as never);
    const surface: SurfaceModel<ReactComponentImplementation> | null =
      [...processor.model.surfacesMap.values()][0] ?? null;
    return { surface, processor };
  }, [messages]);

  useEffect(() => () => processor.model.dispose(), [processor]);

  if (!surface) return null;
  return <A2uiSurface surface={surface} />;
}

export function AdvisorA2uiSurface({
  messages,
  handlers,
  fallback,
}: {
  messages: A2uiMessage[];
  handlers: AdvisorA2uiHandlers;
  fallback: ReactNode;
}) {
  return (
    <AdvisorA2uiContext.Provider value={handlers}>
      <SurfaceErrorBoundary fallback={fallback}>
        <A2uiRenderer messages={messages} />
      </SurfaceErrorBoundary>
    </AdvisorA2uiContext.Provider>
  );
}
