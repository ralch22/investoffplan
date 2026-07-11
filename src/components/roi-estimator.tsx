"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateRoi,
  APPRECIATION_CAP_PCT,
  ROI_DEFAULTS,
  type RoiInput,
} from "@/lib/roi";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/** Pruned, DLD-derived stats for one community — resolved server-side and passed
 *  as props so the client never imports the server-only dld-area-stats module. */
export interface RoiCommunity {
  slug: string;
  name: string;
  grossYieldPct: number | null;
  appreciationPct: number | null;
  medianPpsqft: number | null;
}

interface RoiEstimatorProps {
  communities: RoiCommunity[];
}

/** Short URL keys → keeps shared links compact. */
const PARAM: Record<string, string> = {
  purchasePriceAed: "price",
  sizeSqft: "size",
  downPaymentPct: "dp",
  duringConstructionPct: "dur",
  handoverPct: "ho",
  postHandoverPct: "ph",
  holdingYears: "yrs",
  annualRentAed: "rent",
  serviceChargePerSqftAed: "sc",
  annualAppreciationPct: "apr",
  includeDldFee: "fee",
  realizeSaleAtExit: "sell",
};

const NUMERIC_KEYS: (keyof RoiInput)[] = [
  "purchasePriceAed",
  "sizeSqft",
  "downPaymentPct",
  "duringConstructionPct",
  "handoverPct",
  "postHandoverPct",
  "holdingYears",
  "annualRentAed",
  "serviceChargePerSqftAed",
  "annualAppreciationPct",
];

function readFromUrl(): { input: Partial<RoiInput>; community: string } {
  if (typeof window === "undefined") return { input: {}, community: "" };
  const q = new URLSearchParams(window.location.search);
  const input: Partial<RoiInput> = {};
  for (const key of NUMERIC_KEYS) {
    const raw = q.get(PARAM[key]);
    if (raw != null && raw !== "" && !Number.isNaN(Number(raw))) {
      input[key] = Number(raw) as never;
    }
  }
  if (q.get(PARAM.includeDldFee) != null) {
    input.includeDldFee = q.get(PARAM.includeDldFee) === "1";
  }
  if (q.get(PARAM.realizeSaleAtExit) != null) {
    input.realizeSaleAtExit = q.get(PARAM.realizeSaleAtExit) === "1";
  }
  return { input, community: q.get("c") ?? "" };
}

function buildQuery(input: RoiInput, community: string): string {
  const q = new URLSearchParams();
  for (const key of NUMERIC_KEYS) {
    q.set(PARAM[key], String(input[key]));
  }
  q.set(PARAM.includeDldFee, input.includeDldFee ? "1" : "0");
  q.set(PARAM.realizeSaleAtExit, input.realizeSaleAtExit ? "1" : "0");
  if (community) q.set("c", community);
  return q.toString();
}

const pct = (n: number) => `${n.toFixed(1)}%`;

export function RoiEstimator({ communities }: RoiEstimatorProps) {
  const { dict } = useI18n();
  const t = dict.tools.roi;

  const [input, setInput] = useState<RoiInput>(ROI_DEFAULTS);
  const [community, setCommunity] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from the URL once on mount — a shared link is the source of truth.
  useEffect(() => {
    const { input: fromUrl, community: c } = readFromUrl();
    if (Object.keys(fromUrl).length || c) {
      setInput((prev) => ({ ...prev, ...fromUrl }));
      setCommunity(c);
    }
    hydrated.current = true;
  }, []);

  const result = useMemo(() => calculateRoi(input), [input]);

  // Debounced URL write + analytics fire once inputs settle.
  useEffect(() => {
    if (!hydrated.current) return;
    const id = window.setTimeout(() => {
      const query = buildQuery(input, community);
      window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
      if (input.purchasePriceAed > 0 && input.annualRentAed > 0) {
        trackEvent(ANALYTICS_EVENTS.ROI_CALCULATE, {
          price: input.purchasePriceAed,
          yield: Number(result.grossRentalYieldPct.toFixed(1)),
          years: input.holdingYears,
          community: community || "manual",
        });
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [input, community, result.grossRentalYieldPct]);

  function update<K extends keyof RoiInput>(key: K, value: RoiInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  const onCommunityChange = useCallback(
    (slug: string) => {
      setCommunity(slug);
      const c = communities.find((x) => x.slug === slug);
      if (!c) return;
      setInput((prev) => {
        const next = { ...prev };
        if (c.medianPpsqft && c.medianPpsqft > 0) {
          next.sizeSqft = Math.max(200, Math.round(prev.purchasePriceAed / c.medianPpsqft));
        }
        if (c.grossYieldPct != null) {
          next.annualRentAed = Math.round((prev.purchasePriceAed * c.grossYieldPct) / 100);
        }
        if (c.appreciationPct != null) {
          next.annualAppreciationPct =
            Math.min(APPRECIATION_CAP_PCT, Math.max(0, Number(c.appreciationPct.toFixed(1))));
        }
        return next;
      });
    },
    [communities],
  );

  const selected = communities.find((x) => x.slug === community);
  const rentFromDld = Boolean(selected && selected.grossYieldPct != null);
  const aprFromDld = Boolean(selected && selected.appreciationPct != null);

  const planTotal =
    input.downPaymentPct +
    input.duringConstructionPct +
    input.handoverPct +
    input.postHandoverPct;
  const planOff = Math.abs(planTotal - 100) > 0.5;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — link is already in the address bar */
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* Inputs -------------------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-dark">{t.inputsHeading}</h2>
        <p className="mt-1 text-sm text-muted">{t.inputsSubtitle}</p>

        <div className="mt-6 space-y-5">
          {communities.length > 0 ? (
            <div>
              <label htmlFor="roi-community" className="text-sm font-semibold text-text-dark">
                {t.community}
              </label>
              <select
                id="roi-community"
                value={community}
                onChange={(e) => onCommunityChange(e.target.value)}
                className="iop-input mt-1"
              >
                <option value="">{t.communityNone}</option>
                {communities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selected ? (
                <p className="mt-1.5 text-xs text-muted">
                  <span className="rounded bg-brand-muted px-1.5 py-0.5 font-semibold text-brand">
                    {t.dldBadge}
                  </span>{" "}
                  {selected.grossYieldPct != null
                    ? interpolate(t.communityYield, { yield: pct(selected.grossYieldPct) })
                    : t.communityNoYield}
                </p>
              ) : null}
            </div>
          ) : null}

          <Field
            label={t.purchasePrice}
            id="roi-price"
            value={input.purchasePriceAed}
            onChange={(v) => update("purchasePriceAed", v)}
            step={50_000}
            min={100_000}
          />
          <Field
            label={t.size}
            id="roi-size"
            value={input.sizeSqft}
            onChange={(v) => update("sizeSqft", v)}
            step={50}
            min={0}
            note={t.sizeNote}
          />
          <Field
            label={t.downPayment}
            id="roi-down"
            value={input.downPaymentPct}
            onChange={(v) => update("downPaymentPct", v)}
            min={0}
            max={100}
          />

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold text-text-dark">
              {t.planHeading}
            </legend>
            <div className="space-y-4">
              <Field
                label={t.duringConstruction}
                id="roi-during"
                value={input.duringConstructionPct}
                onChange={(v) => update("duringConstructionPct", v)}
                min={0}
                max={100}
              />
              <Field
                label={t.onHandover}
                id="roi-handover"
                value={input.handoverPct}
                onChange={(v) => update("handoverPct", v)}
                min={0}
                max={100}
              />
              <Field
                label={t.postHandover}
                id="roi-post"
                value={input.postHandoverPct}
                onChange={(v) => update("postHandoverPct", v)}
                min={0}
                max={100}
              />
            </div>
            <p className={cn("mt-3 text-xs", planOff ? "text-accent-red" : "text-muted")}>
              {planOff
                ? interpolate(t.planSumWarn, { total: String(Math.round(planTotal)) })
                : t.planSumNote}
            </p>
          </fieldset>

          <Field
            label={t.holdingPeriod}
            id="roi-years"
            value={input.holdingYears}
            onChange={(v) => update("holdingYears", v)}
            min={1}
            max={30}
          />
          <Field
            label={t.annualRent}
            id="roi-rent"
            value={input.annualRentAed}
            onChange={(v) => update("annualRentAed", v)}
            step={1_000}
            min={0}
            note={rentFromDld ? t.rentPrefillNote : t.rentManualNote}
          />
          <Field
            label={t.serviceCharge}
            id="roi-sc"
            value={input.serviceChargePerSqftAed}
            onChange={(v) => update("serviceChargePerSqftAed", v)}
            step={1}
            min={0}
            note={t.serviceChargeNote}
          />
          <Field
            label={t.appreciation}
            id="roi-apr"
            value={input.annualAppreciationPct}
            onChange={(v) => update("annualAppreciationPct", v)}
            step={0.5}
            min={0}
            max={APPRECIATION_CAP_PCT}
            note={aprFromDld ? t.appreciationDldNote : t.appreciationNote}
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-dark">
            <input
              type="checkbox"
              checked={input.includeDldFee}
              onChange={(e) => update("includeDldFee", e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            {t.includeDldFee}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-dark">
            <input
              type="checkbox"
              checked={input.realizeSaleAtExit}
              onChange={(e) => update("realizeSaleAtExit", e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            {t.realizeSale}
          </label>
        </div>
      </section>

      {/* Outputs ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="rounded-2xl bg-brand p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
            {interpolate(t.returnHeadline, { years: String(input.holdingYears) })}
          </p>
          <p className="mt-2 text-4xl font-semibold tabular-nums" data-testid="roi-total-return">
            {formatPrice(result.totalReturnAed, "AED")}
          </p>
          <p className="mt-2 text-sm text-white/85">
            {interpolate(t.returnSubline, {
              total: pct(result.totalReturnPct),
              annual: pct(result.annualizedReturnPct),
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-dark">{t.resultsHeading}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row
              label={t.cashToHandover}
              value={formatPrice(result.cashInvestedToHandoverAed, "AED")}
            />
            <Row label={t.grossAnnualRent} value={formatPrice(result.grossAnnualRentAed, "AED")} />
            <Row
              label={t.annualServiceCharge}
              value={`− ${formatPrice(result.annualServiceChargeAed, "AED")}`}
            />
            <Row
              label={t.netAnnualRent}
              value={formatPrice(result.netAnnualRentAed, "AED")}
              highlight
            />
            <Row label={t.netYield} value={pct(result.netRentalYieldPct)} />
            <Row
              label={interpolate(t.projectedAppreciation, { years: String(input.holdingYears) })}
              value={formatPrice(result.capitalAppreciationAed, "AED")}
            />
            <Row
              label={t.totalReturn}
              value={formatPrice(result.totalReturnAed, "AED")}
              highlight
            />
            <Row label={t.totalReturnPctLabel} value={pct(result.totalReturnPct)} />
            <Row label={t.annualizedReturn} value={pct(result.annualizedReturnPct)} />
            <Row
              label={t.paybackYears}
              value={
                result.rentalPaybackYears != null
                  ? interpolate(t.paybackValue, {
                      years: result.rentalPaybackYears.toFixed(1),
                    })
                  : "—"
              }
            />
          </div>

          {!input.realizeSaleAtExit ? (
            <p className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-xs text-muted">
              {t.unrealizedNote}
            </p>
          ) : null}

          <button
            type="button"
            onClick={copyLink}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand transition hover:border-brand"
          >
            {copied ? t.shareCopied : t.share}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface-alt p-6">
          <h3 className="text-sm font-semibold text-text-dark">{t.assumptionsHeading}</h3>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted">
            <li>• {t.assumptionCash}</li>
            <li>• {t.assumptionRentFlat}</li>
            <li>
              •{" "}
              {interpolate(t.assumptionAppreciation, {
                cap: String(APPRECIATION_CAP_PCT),
              })}
            </li>
            <li>• {t.assumptionServiceCharge}</li>
            <li>• {t.assumptionReturnBase}</li>
          </ul>
          <p className="mt-4 text-xs font-semibold leading-relaxed text-text-dark">
            {t.disclaimer}
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
  note,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  note?: string;
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
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="iop-input mt-1 tabular-nums"
      />
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
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
      <span className={highlight ? "font-semibold text-text-dark" : "text-muted"}>{label}</span>
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
