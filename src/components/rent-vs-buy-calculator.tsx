"use client";

import { useMemo, useState } from "react";
import {
  calculateRentVsBuy,
  RENT_VS_BUY_DEFAULTS,
  type RentVsBuyInput,
} from "@/lib/rent-vs-buy";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export function RentVsBuyCalculator() {
  const [input, setInput] = useState<RentVsBuyInput>(RENT_VS_BUY_DEFAULTS);

  const result = useMemo(() => calculateRentVsBuy(input), [input]);

  function update<K extends keyof RentVsBuyInput>(key: K, value: RentVsBuyInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-dark">Your circumstances</h2>
        <p className="mt-1 text-sm text-muted">
          Adjust price, rent, mortgage terms, and how long you plan to stay.
        </p>

        <div className="mt-6 space-y-5">
          <Field
            label="Property price (AED)"
            id="rvb-price"
            type="number"
            value={input.propertyPriceAed}
            onChange={(v) => update("propertyPriceAed", v)}
            step={50_000}
          />
          <Field
            label="Down payment (%)"
            id="rvb-down"
            type="number"
            value={input.downPaymentPct}
            onChange={(v) => update("downPaymentPct", v)}
            min={5}
            max={80}
          />
          <Field
            label="Mortgage rate (% p.a.)"
            id="rvb-rate"
            type="number"
            value={input.annualMortgageRatePct}
            onChange={(v) => update("annualMortgageRatePct", v)}
            step={0.1}
          />
          <Field
            label="Mortgage term (years)"
            id="rvb-term"
            type="number"
            value={input.mortgageTermYears}
            onChange={(v) => update("mortgageTermYears", v)}
            min={5}
            max={30}
          />
          <Field
            label="Monthly rent (AED)"
            id="rvb-rent"
            type="number"
            value={Math.round(input.monthlyRentAed)}
            onChange={(v) => update("monthlyRentAed", v)}
            step={500}
          />
          <Field
            label="Annual rent increase (%)"
            id="rvb-rent-growth"
            type="number"
            value={input.annualRentIncreasePct}
            onChange={(v) => update("annualRentIncreasePct", v)}
            step={0.5}
          />
          <Field
            label="Property value growth (% p.a.)"
            id="rvb-appreciation"
            type="number"
            value={input.annualPropertyGrowthPct}
            onChange={(v) => update("annualPropertyGrowthPct", v)}
            step={0.5}
          />
          <Field
            label="Comparison period (years)"
            id="rvb-years"
            type="number"
            value={input.comparisonYears}
            onChange={(v) => update("comparisonYears", v)}
            min={1}
            max={30}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-dark">Monthly payments</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Metric
              label="Buying (mortgage)"
              value={formatPrice(result.monthlyMortgageAed, "AED")}
              tone="brand"
            />
            <Metric
              label="Renting (year 1)"
              value={formatPrice(result.monthlyRentYear1Aed, "AED")}
              tone="muted"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-dark">
            Long-term position ({input.comparisonYears} years)
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Total rent paid" value={formatPrice(result.totalRentPaidAed, "AED")} />
            <Row
              label="Total buy cost (down + mortgage + maintenance)"
              value={formatPrice(result.totalBuyCostAed, "AED")}
            />
            <Row
              label="Estimated equity at end"
              value={formatPrice(result.estimatedEquityAed, "AED")}
            />
            <Row
              label="Net position — buy"
              value={formatPrice(result.netBuyPositionAed, "AED")}
              highlight={result.netBuyPositionAed >= result.netRentPositionAed}
            />
            <Row
              label="Net position — rent"
              value={formatPrice(result.netRentPositionAed, "AED")}
              highlight={result.netRentPositionAed > result.netBuyPositionAed}
            />
          </div>
          {result.breakEvenYear ? (
            <p className="mt-4 rounded-xl bg-brand-muted px-4 py-3 text-sm text-brand">
              Buying may overtake renting around year {result.breakEvenYear}, assuming
              steady appreciation and rent growth.
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "rounded-2xl p-6 text-white",
            result.recommendation === "buy"
              ? "bg-brand"
              : result.recommendation === "rent"
                ? "bg-surface-darker"
                : "bg-muted",
          )}
        >
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
            Indicative outlook
          </p>
          <p className="mt-2 text-xl font-semibold">
            {result.recommendation === "buy"
              ? "Buying may build more wealth over this horizon"
              : result.recommendation === "rent"
                ? "Renting may cost less over this horizon"
                : "Outcomes are close — model a longer stay or different down payment"}
          </p>
          <p className="mt-3 text-sm text-white/85">
            Illustrative only — not financial advice. UAE mortgage eligibility, fees, and
            off-plan payment plans will change your real numbers.
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  type,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  id: string;
  type: "number";
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-dark">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="iop-input mt-1 w-full font-mono tabular-nums"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "muted";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "brand" ? "text-brand" : "text-text-dark",
        )}
      >
        {value}
      </p>
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
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0">
      <span className="text-muted">{label}</span>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          highlight ? "text-brand" : "text-text-dark",
        )}
      >
        {value}
      </span>
    </div>
  );
}