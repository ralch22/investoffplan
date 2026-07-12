"use client";

import { useMemo, useState } from "react";
import {
  downPaymentAed,
  parsePaymentPlan,
} from "@/lib/investment-metrics";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n";

interface PaymentCalculatorProps {
  priceAed: number;
  paymentPlan: string;
  projectName?: string;
}

const MIN_PRICE = 250_000;
const MAX_PRICE = 50_000_000;

function clampPrice(value: number): number {
  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, value));
}

export function PaymentCalculator({
  priceAed,
  paymentPlan,
  projectName,
}: PaymentCalculatorProps) {
  const { dict } = useI18n();
  const t = dict.tools.paymentCalc;
  const [price, setPrice] = useState(clampPrice(priceAed));

  const schedule = useMemo(() => {
    const parsed = parsePaymentPlan(paymentPlan);
    if (!parsed) return null;
    const phases = [
      { label: t.phaseDownPayment, pct: parsed.downPaymentPct, tone: "bg-brand" },
      {
        label: t.phaseDuringConstruction,
        pct: parsed.duringPct,
        tone: "bg-brand-dark",
      },
      { label: t.phaseOnHandover, pct: parsed.handoverPct, tone: "bg-brand-light" },
      { label: t.phaseAfterHandover, pct: parsed.afterPct, tone: "bg-muted-light" },
    ].filter((p) => p.pct > 0);

    return phases.map((p) => ({
      ...p,
      amount: Math.round((price * p.pct) / 100),
    }));
  }, [price, paymentPlan, t]);

  const down = downPaymentAed(price, paymentPlan);
  const totalPct = schedule?.reduce((sum, row) => sum + row.pct, 0) ?? 0;

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-elevation-sm">
      <h2 className="text-xl font-semibold text-text-dark">{t.heading}</h2>
      {projectName ? (
        <p className="mt-1 text-sm text-muted">
          {interpolate(t.forProject, { name: projectName })}
        </p>
      ) : null}

      <div className="mt-5">
        <label htmlFor="calc-price" className="block text-sm font-medium text-text-dark">
          {t.purchasePrice}
        </label>
        <input
          id="calc-price"
          type="number"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={50_000}
          value={price}
          onChange={(e) => setPrice(clampPrice(Number(e.target.value) || MIN_PRICE))}
          className="iop-input mt-1 max-w-xs font-mono tabular-nums"
        />
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={50_000}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-4 h-2 w-full max-w-md cursor-pointer accent-brand"
          aria-label="Adjust purchase price"
        />
        <p className="mt-2 text-xs text-muted-light">
          {formatPrice(MIN_PRICE, "AED", { compact: true })} –{" "}
          {formatPrice(MAX_PRICE, "AED", { compact: true })}
        </p>
      </div>

      {paymentPlan?.trim() ? (
        <p className="mt-4 text-sm text-muted">
          {t.planLabel} <span className="font-semibold text-text-dark">{paymentPlan}</span>
        </p>
      ) : null}

      {down != null ? (
        down > 0 ? (
          <p className="mt-2 text-lg font-semibold text-brand">
            {t.downPaymentLabel} {formatPrice(down, "AED")}
          </p>
        ) : (
          <p className="mt-2 text-lg font-semibold text-brand">
            {t.noDownPayment}
          </p>
        )
      ) : null}

      {schedule ? (
        <>
          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-surface-alt">
            {schedule.map((row) => (
              <div
                key={row.label}
                className={cn("h-full transition-all duration-300", row.tone)}
                style={{ width: `${(row.pct / totalPct) * 100}%` }}
                title={`${row.label}: ${row.pct}%`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {schedule.map((row) => (
              <span key={row.label} className="inline-flex items-center gap-2 text-xs text-muted">
                <span className={cn("h-2.5 w-2.5 rounded-full", row.tone)} />
                {row.label} ({row.pct}%)
              </span>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-start text-sm">
              <thead className="bg-surface-alt text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.phaseCol}</th>
                  <th className="px-4 py-3 font-medium">%</th>
                  <th className="px-4 py-3 font-medium">{t.amountCol}</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="px-4 py-3 text-text-dark">{row.label}</td>
                    <td className="px-4 py-3 text-muted">{row.pct}%</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-brand">
                      {formatPrice(row.amount, "AED")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-alt p-4 text-sm text-muted">
          {t.noSchedule}
        </p>
      )}
    </section>
  );
}
