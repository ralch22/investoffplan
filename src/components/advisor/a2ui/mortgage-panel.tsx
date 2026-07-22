"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { formatPrice } from "@/lib/format";
import {
  calculateMortgage,
  MAX_TERM_YEARS,
  MIN_DOWN_PAYMENT_PCT,
} from "@/lib/mortgage";

export interface AdvisorMortgageInput {
  propertyPriceAed: number;
  downPaymentPct: number;
  annualRatePct: number;
  termYears: number;
}

/**
 * A2UI `MortgagePanel` leaf — turns the advisor's illustrative mortgage prose
 * into an interactive panel. The sliders recompute entirely client-side via the
 * shared `calculateMortgage`, so adjusting them costs zero LLM turns and never
 * touches the daily Workers-AI budget.
 */
export function AdvisorMortgagePanel({
  propertyPriceAed,
  downPaymentPct,
  annualRatePct,
  termYears,
}: AdvisorMortgageInput) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  const [downPct, setDownPct] = useState(downPaymentPct);
  const [years, setYears] = useState(termYears);

  const result = calculateMortgage({
    propertyPriceAed,
    downPaymentPct: downPct,
    annualRatePct,
    termYears: years,
    includeFees: true,
  });

  const money = (v: number) => formatPrice(v, "AED", { compact: true });

  return (
    <div className="w-full space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-text-dark">{t.mortgageTitle}</p>
        <p className="text-xs text-muted">{formatPrice(propertyPriceAed, "AED")}</p>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <p className="text-xs text-muted">{t.mortgageMonthly}</p>
          <p
            data-testid="advisor-mortgage-monthly"
            className="text-2xl font-semibold leading-tight text-brand"
          >
            {money(result.monthlyPaymentAed)}
          </p>
        </div>
        <div className="ms-auto text-end">
          <p className="text-xs text-muted">{t.mortgageDownPayment}</p>
          <p className="text-sm font-medium text-text-dark">
            {money(result.downPaymentAed)}
          </p>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted">{t.mortgageCashToClose}</p>
          <p className="text-sm font-medium text-text-dark">
            {money(result.cashToCloseAed)}
          </p>
        </div>
      </div>

      <label className="block">
        <span className="flex justify-between text-xs text-muted">
          <span>{t.mortgageDownPct}</span>
          <span className="font-medium text-text-dark">{downPct}%</span>
        </span>
        <input
          type="range"
          min={MIN_DOWN_PAYMENT_PCT}
          max={60}
          step={5}
          value={downPct}
          onChange={(e) => setDownPct(Number(e.target.value))}
          aria-label={t.mortgageDownPct}
          className="mt-1 w-full accent-[var(--brand)]"
        />
      </label>

      <label className="block">
        <span className="flex justify-between text-xs text-muted">
          <span>{t.mortgageTerm}</span>
          <span className="font-medium text-text-dark">
            {years} {t.mortgageYears}
          </span>
        </span>
        <input
          type="range"
          min={5}
          max={MAX_TERM_YEARS}
          step={1}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          aria-label={t.mortgageTerm}
          className="mt-1 w-full accent-[var(--brand)]"
        />
      </label>

      <p className="text-[11px] leading-snug text-muted">
        {t.mortgageDisclaimer.replace("{rate}", String(annualRatePct))}
      </p>

      <Link
        href={localePath(locale, "/tools/mortgage")}
        className="focus-ring inline-block rounded-sm text-xs font-semibold text-brand hover:text-brand-dark"
      >
        {t.mortgageFullTool} →
      </Link>
    </div>
  );
}
