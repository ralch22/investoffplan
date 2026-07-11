"use client";

import { LocaleLink } from "@/components/locale-link";
import { useI18n } from "@/i18n/locale-provider";

/**
 * Tools-hub entry card for the Investor Match quiz. Client component so the
 * copy localizes via the shared dictionary in both the EN and AR trees.
 */
export function InvestorMatchToolCard() {
  const { dict } = useI18n();
  const card = dict.tools.investorMatch.card;

  return (
    <LocaleLink
      href="/tools/investor-match"
      className="group flex flex-col rounded-2xl border border-brand/40 bg-brand-muted p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {card.eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-text-dark group-hover:text-brand">
        {card.title}
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {card.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
        {card.cta}
      </span>
    </LocaleLink>
  );
}
