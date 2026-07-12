"use client";

import { parsePaymentPlan } from "@/lib/investment-metrics";
import { useI18n } from "@/i18n/locale-provider";

const STAGE_KEYS = [
  { key: "downPaymentPct" as const, stage: "down" as const, className: "bg-brand" },
  {
    key: "duringPct" as const,
    stage: "during" as const,
    className: "bg-brand/70",
  },
  {
    key: "handoverPct" as const,
    stage: "handover" as const,
    className: "bg-brand/45",
  },
  { key: "afterPct" as const, stage: "after" as const, className: "bg-brand/25" },
];

/**
 * Stacked payment-plan bar. `parsePaymentPlan` grabs raw digits, so junk
 * labels like "2 Payment Plans" mis-parse (→ 2% down); we only render a bar
 * when the parsed stages sum to a plausible 95–105%. Otherwise render null and
 * let the caller keep the plain text label.
 */
export function PaymentPlanBar({ plan }: { plan: string }) {
  const { dict } = useI18n();
  const stages = dict.compare.paymentStages;
  const parsed = parsePaymentPlan(plan);
  if (!parsed) return null;
  const segments = STAGE_KEYS.map((s) => ({
    key: s.key,
    className: s.className,
    label: stages[s.stage],
    shortLabel: s.stage === "during" ? stages.duringShort : stages[s.stage],
    pct: parsed[s.key],
  })).filter((s) => s.pct > 0);
  const total = segments.reduce((sum, s) => sum + s.pct, 0);
  if (total < 95 || total > 105) return null;

  const stagesText = segments.map((s) => `${s.pct}% ${s.label}`).join(", ");
  const label = dict.compare.paymentPlanAria
    .replace("{plan}", plan)
    .replace("{stages}", stagesText);

  return (
    <div className="mt-2" role="img" aria-label={label}>
      <div className="flex h-2.5 w-full max-w-[180px] overflow-hidden rounded-full bg-surface-alt">
        {segments.map((s) => (
          <div
            key={s.key}
            className={s.className}
            style={{ width: `${(s.pct / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex max-w-[180px] flex-wrap gap-x-2 text-[10px] text-muted">
        {segments.map((s) => (
          <span key={s.key}>
            {s.pct}% {s.shortLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
