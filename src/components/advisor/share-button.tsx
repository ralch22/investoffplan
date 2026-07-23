"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import type { AdvisorCard } from "@/lib/advisor/types";

/**
 * Turn an advisor answer into a link someone can send.
 *
 * This exists as much for the team as for shoppers: today a grounded shortlist
 * lives inside one person's chat drawer, so sharing it means screenshots. A
 * link keeps the numbers live and lets the recipient act on them.
 *
 * Only INGREDIENTS are posted — slugs and the reply text. The server verifies
 * every slug against the catalogue and recomposes the surface at read time, so
 * nothing here can decide what a card renders.
 */
export function AdvisorShareButton({
  cards,
  reply,
  mortgagePriceAed,
}: {
  cards: AdvisorCard[];
  reply: string;
  mortgagePriceAed?: number;
}) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");

  async function share() {
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/advisor/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          reply,
          slugs: cards.map((c) => c.slug),
          mortgagePriceAed,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("no url");

      const absolute = `${window.location.origin}${locale === "ar" ? "/ar" : ""}${url}`;
      await navigator.clipboard.writeText(absolute);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      // Sharing is a bonus on top of an answer the user already has — say so
      // quietly and let them carry on.
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    }
  }

  const label =
    state === "copied" ? t.shareCopied : state === "error" ? t.shareFailed : t.share;

  return (
    <button
      type="button"
      onClick={share}
      disabled={state === "busy"}
      className="focus-ring mt-2 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {label}
    </button>
  );
}
