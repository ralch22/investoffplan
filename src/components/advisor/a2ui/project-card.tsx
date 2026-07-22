"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { bedsLabel, formatPrice } from "@/lib/format";
import type { AdvisorCard } from "@/lib/advisor/types";

/**
 * Presentational advisor project card. Shared by BOTH the legacy `cards` path
 * and the A2UI `ProjectCard` catalog component so the two render identically —
 * extracted from the widget's former inline `AdvisorCardView`.
 */
export function AdvisorProjectCard({ card }: { card: AdvisorCard }) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-brand-muted">
      {card.imageUrl ? (
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
          <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="96px" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-semibold text-text-dark">{card.name}</p>
        <p className="truncate text-xs text-muted">
          {card.developer} · {card.area}
        </p>
        <p className="mt-1 text-xs font-medium text-text-dark">
          {card.fromPriceAed
            ? `${t.from} ${formatPrice(card.fromPriceAed, "AED")}`
            : ""}
          {card.handover ? ` · ${card.handover}` : ""}
        </p>
        <p className="text-xs text-muted">
          {card.beds?.length
            ? `${card.beds.map((n) => bedsLabel(n, dict)).join("–")}`
            : ""}
        </p>
        <Link
          href={localePath(locale, `/projects/${card.slug}`)}
          className="focus-ring mt-2 inline-block rounded-sm text-xs font-semibold text-brand hover:text-brand-dark"
        >
          {t.viewProject} →
        </Link>
      </div>
    </div>
  );
}
