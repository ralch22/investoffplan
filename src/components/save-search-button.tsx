"use client";

import { useState } from "react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { serializeFilters } from "@/lib/alerts/match";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import type { ProjectFilters as Filters } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";

interface SaveSearchButtonProps {
  filters: Filters;
  className?: string;
}

/**
 * "Save search" → saved_searches row with weekly email alerts on. Signed-out
 * users get the contextual sign-in modal (same mechanism as user-menu.tsx).
 * Static-safe: useSession resolves client-side only.
 */
export function SaveSearchButton({ filters, className }: SaveSearchButtonProps) {
  const { locale, dict } = useI18n();
  const { data: session } = useSession();
  const [signInOpen, setSignInOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const s = dict.serp;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || status === "saving") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/me/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          filters: serializeFilters(filters),
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackEvent(ANALYTICS_EVENTS.ALERT_SUBSCRIBE, { source: "serp" });
      setStatus("saved");
      setLabel("");
      setTimeout(() => {
        setPromptOpen(false);
        setStatus("idle");
      }, 2200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (!session?.user) {
            setSignInOpen(true);
            return;
          }
          setPromptOpen((v) => !v);
          setStatus("idle");
        }}
        className="iop-btn-press focus-ring inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 4h12v17l-6-4-6 4V4z" />
        </svg>
        {s.saveSearch}
      </button>

      {promptOpen ? (
        <form
          onSubmit={handleSave}
          className="absolute start-0 top-full z-[var(--z-overlay)] mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-elevation-lg"
        >
          <p className="text-xs font-semibold text-text-dark">{s.saveSearchTitle}</p>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={s.saveSearchPlaceholder}
            maxLength={80}
            autoFocus
            className="focus-ring mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
          />
          {status === "saved" ? (
            <p className="mt-2 text-xs text-green-700">{s.saveSearchSaved}</p>
          ) : status === "error" ? (
            <p className="mt-2 text-xs text-brand">{s.saveSearchError}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPromptOpen(false);
                setStatus("idle");
              }}
              className="focus-ring rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-text-dark"
            >
              {s.saveSearchCancel}
            </button>
            <button
              type="submit"
              disabled={!label.trim() || status === "saving"}
              className="iop-btn-press focus-ring rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {s.saveSearchConfirm}
            </button>
          </div>
        </form>
      ) : null}

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
