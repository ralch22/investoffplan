"use client";

import { useMemo, useState } from "react";
import {
  calculateMortgage,
  MAX_TERM_YEARS,
  MIN_DOWN_PAYMENT_PCT,
  type MortgageInput,
} from "@/lib/mortgage";
import { formatPrice } from "@/lib/format";
import { AnimatedCurrency } from "@/components/animated-currency";

const DEFAULTS: MortgageInput = {
  propertyPriceAed: 1_500_000,
  downPaymentPct: 20,
  annualRatePct: 4.25,
  termYears: 25,
  includeFees: true,
};

export function MortgageCalculator() {
  const [input, setInput] = useState<MortgageInput>(DEFAULTS);
  const result = useMemo(() => calculateMortgage(input), [input]);

  function update<K extends keyof MortgageInput>(key: K, value: MortgageInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-dark">Your mortgage</h2>
        <p className="mt-1 text-sm text-muted">
          UAE norms applied: max {MAX_TERM_YEARS}-year term, expat minimum{" "}
          {MIN_DOWN_PAYMENT_PCT}% down payment under AED 5M.
        </p>

        <div className="mt-6 space-y-5">
          <Field
            label="Property price (AED)"
            id="mtg-price"
            value={input.propertyPriceAed}
            onChange={(v) => update("propertyPriceAed", v)}
            step={50_000}
            min={100_000}
          />
          <Field
            label="Down payment (%)"
            id="mtg-down"
            value={input.downPaymentPct}
            onChange={(v) => update("downPaymentPct", v)}
            min={MIN_DOWN_PAYMENT_PCT}
            max={80}
          />
          <Field
            label="Interest rate (% p.a.)"
            id="mtg-rate"
            value={input.annualRatePct}
            onChange={(v) => update("annualRatePct", v)}
            step={0.05}
            min={0}
            max={12}
          />
          <Field
            label={`Term (years, max ${MAX_TERM_YEARS})`}
            id="mtg-term"
            value={input.termYears}
            onChange={(v) => update("termYears", v)}
            min={1}
            max={MAX_TERM_YEARS}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-dark">
            <input
              type="checkbox"
              checked={input.includeFees}
              onChange={(e) => update("includeFees", e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            Include DLD 4% transfer fee + typical fixed fees
          </label>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl bg-brand p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
            Monthly payment
          </p>
          <p className="mt-2 text-4xl font-semibold tabular-nums">
            <AnimatedCurrency value={result.monthlyPaymentAed} currency="AED" />
          </p>
          <p className="mt-2 text-sm text-white/85">
            Stress-tested at +2%: {formatPrice(result.stressedMonthlyPaymentAed, "AED")}
            /month
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-dark">Breakdown</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Down payment" value={formatPrice(result.downPaymentAed, "AED")} />
            <Row label="Loan amount" value={formatPrice(result.loanAmountAed, "AED")} />
            <Row
              label="Total interest over term"
              value={formatPrice(result.totalInterestAed, "AED")}
            />
            {input.includeFees ? (
              <>
                <Row label="DLD transfer fee (4%)" value={formatPrice(result.dldFeeAed, "AED")} />
                <Row
                  label="Typical fixed fees (trustee, valuation, registration)"
                  value={formatPrice(result.estimatedFixedFeesAed, "AED")}
                />
              </>
            ) : null}
            <Row
              label="Estimated cash to close"
              value={formatPrice(result.cashToCloseAed, "AED")}
              highlight
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Illustrative only — not financial advice. Off-plan purchases under
            construction are commonly capped at 50% loan-to-value; completed-property
            caps differ. Confirm current rates and eligibility with your bank.
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-text-dark">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="iop-input mt-1"
      />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={highlight ? "font-semibold text-text-dark" : "text-muted"}>
        {label}
      </span>
      <span className={highlight ? "font-semibold text-brand" : "font-medium text-text-dark"}>
        {value}
      </span>
    </div>
  );
}
