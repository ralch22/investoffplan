import { parsePaymentPlan } from "@/lib/investment-metrics";

const STAGES = [
  { key: "downPaymentPct", label: "down", className: "bg-brand" },
  { key: "duringPct", label: "during construction", className: "bg-brand/70" },
  { key: "handoverPct", label: "on handover", className: "bg-brand/45" },
  { key: "afterPct", label: "post-handover", className: "bg-brand/25" },
] as const;

/**
 * Stacked payment-plan bar. `parsePaymentPlan` grabs raw digits, so junk
 * labels like "2 Payment Plans" mis-parse (→ 2% down); we only render a bar
 * when the parsed stages sum to a plausible 95–105%. Otherwise render null and
 * let the caller keep the plain text label.
 */
export function PaymentPlanBar({ plan }: { plan: string }) {
  const parsed = parsePaymentPlan(plan);
  if (!parsed) return null;
  const segments = STAGES.map((s) => ({ ...s, pct: parsed[s.key] })).filter(
    (s) => s.pct > 0,
  );
  const total = segments.reduce((sum, s) => sum + s.pct, 0);
  if (total < 95 || total > 105) return null;

  const label = `Payment plan ${plan}: ${segments
    .map((s) => `${s.pct}% ${s.label}`)
    .join(", ")}`;

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
            {s.pct}% {s.label === "during construction" ? "during" : s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
