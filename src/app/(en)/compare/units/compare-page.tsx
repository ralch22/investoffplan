"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrimaryButton } from "@/components/ui/primary-button";
import { removeCompareId, serializeCompareIds } from "@/lib/compare";
import { setStoredCompareIds } from "@/lib/compare-storage";
import type { CompareUnitId } from "@/lib/compare";
import { useCatalog, type FlatUnit } from "@/lib/catalog-browser";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import {
  bedsLabel,
  cityLabel,
  formatPrice,
  sqftLabel,
  propertyTypeLabel,
} from "@/lib/format";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { hasPaymentPlan, unitPricePerSqft } from "@/lib/investment-metrics";
import {
  compareMonthlyPaymentAed,
  compareUnitKey,
  pickWinner,
  type CompareAreaStats,
  type CompareStatsMap,
} from "@/lib/compare-stats";
import { hasDownloadableBrochure } from "@/lib/brochure";
import { CompactMediaGallery } from "@/components/compact-media-gallery";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { PaymentPlanBar } from "@/components/compare/payment-plan-bar";
import { CompareSummaryStrip } from "@/components/compare/compare-summary-strip";
import { getProjectGalleryImages } from "@/lib/project-gallery-images";
import { cn } from "@/lib/cn";
import { useCurrency } from "@/hooks/use-currency";
import type { CurrencyCode } from "@/lib/types";

interface ComparePageProps {
  initialIds: CompareUnitId[];
  initialItems: FlatUnit[];
  initialStats?: CompareStatsMap;
}

interface CompareRow {
  label: string;
  hint?: string;
  render: (
    item: FlatUnit,
    currency: CurrencyCode,
    stats?: CompareAreaStats,
  ) => React.ReactNode;
  /** Numeric accessor for winner highlighting. */
  num?: (item: FlatUnit, stats?: CompareAreaStats) => number | null;
  better?: "higher" | "lower";
}

const MAX_SLOTS = 3;

const isApiMode = process.env.NEXT_PUBLIC_CATALOG_API === "1";

/** Mobile sticky first column: opaque bg + subtle trailing-edge shadow. */
const STICKY_LABEL_CLASS =
  "max-md:sticky max-md:start-0 max-md:z-[1] max-md:bg-white max-md:shadow-[4px_0_8px_-6px_rgba(0,0,0,0.18)]";

export function ComparePage({
  initialIds,
  initialItems,
  initialStats = {},
}: ComparePageProps) {
  const { api, loading } = useCatalog();
  const currency = useCurrency();
  const { dict, locale } = useI18n();

  // BASE_ROWS defined here (inside the component) so dict is accessible.
  const BASE_ROWS: CompareRow[] = [
    // "Property type" and "Bedrooms" rows are injected per-render (locale-aware).
    {
      label: dict.compare.startingPrice,
      render: (item, currency) => formatPrice(item.unit.launchPriceAed, currency),
      num: (item) => (item.unit.launchPriceAed > 0 ? item.unit.launchPriceAed : null),
      better: "lower",
    },
    {
      label: dict.pdp.keyFacts.paymentPlan,
      render: (item) =>
        hasPaymentPlan(item.project.paymentPlan) ? (
          <>
            <span>{item.project.paymentPlan.trim()}</span>
            <PaymentPlanBar plan={item.project.paymentPlan} />
          </>
        ) : (
          <span>{dict.pdp.keyFacts.onRequest}</span>
        ),
    },
    {
      label: dict.pdp.timeline.handover,
      render: (item) => item.project.handover ?? dict.pdp.timeline.tba,
    },
    // "Bedrooms" row injected per-render below (locale-aware).
    {
      label: dict.compare.squareFootage,
      render: (item) => sqftLabel(item.unit.sqftMin, item.unit.sqftMax, dict),
      num: (item) => (item.unit.sqftMin > 0 ? item.unit.sqftMin : null),
      better: "higher",
    },
    {
      label: dict.pdp.keyFacts.location,
      render: (item) =>
        `${cityLabel(item.project.city, dict)}, ${item.project.area}`,
    },
    {
      label: dict.compare.aedPerSqft,
      render: (item) => {
        const v = unitPricePerSqft(item);
        return v ? `AED ${v.toLocaleString()}` : "—";
      },
      num: (item) => unitPricePerSqft(item),
      better: "lower",
    },
    {
      label: dict.compare.grossYield,
      hint: dict.compare.grossYieldHint,
      render: (_item, _currency, stats) =>
        stats?.grossYieldPct != null ? `${stats.grossYieldPct}%` : "—",
      num: (_item, stats) => stats?.grossYieldPct ?? null,
      better: "higher",
    },
    {
      label: dict.compare.estMonthlyPayment,
      hint: dict.compare.estMonthlyPaymentHint,
      render: (item, currency) => {
        const monthly = compareMonthlyPaymentAed(item);
        return monthly != null ? `${formatPrice(monthly, currency)}/mo` : "—";
      },
      num: (item) => compareMonthlyPaymentAed(item),
      better: "lower",
    },
    {
      label: dict.common.brochure,
      render: (item) =>
        hasDownloadableBrochure(item.project)
          ? dict.compare.pdfReady
          : dict.pdp.keyFacts.onRequest,
    },
    {
      label: dict.pdp.about.amenities,
      render: (item) => {
        const ams = item.project.amenities;
        if (!ams || ams.length === 0) return "—";
        return (
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {ams.slice(0, 5).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
            {ams.length > 5 && (
              <li>{dict.compare.moreAmenities.replace("{count}", String(ams.length - 5))}</li>
            )}
          </ul>
        );
      },
    },
  ];

  const ROWS: CompareRow[] = [
    { label: dict.serp.filters.propertyType, render: (item) => propertyTypeLabel(item.unit.propertyType, dict, locale) },
    ...BASE_ROWS.slice(0, 3),
    { label: dict.compare.bedrooms, render: (item) => bedsLabel(item.unit.beds, dict) },
    ...BASE_ROWS.slice(3),
  ];

  const router = useRouter();
  const [compareIds, setCompareIds] = useState<CompareUnitId[]>(initialIds);
  const items = useMemo(() => {
    if (!isApiMode && api) return api.resolveCompareUnits(compareIds);
    return initialItems.filter(item =>
      compareIds.includes(`${item.project.id}:${item.unit.id}` as CompareUnitId)
    );
  }, [isApiMode, api, compareIds, initialItems]);
  const emptySlots = Math.max(0, MAX_SLOTS - items.length);

  // Mobile dot indicator: which compare column the scroller is closest to.
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollDot, setScrollDot] = useState(0);
  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || items.length < 2) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const ratio = Math.min(1, Math.max(0, el.scrollLeft / max));
    setScrollDot(Math.round(ratio * (items.length - 1)));
  }

  // Fire compare_view once per visit when a real comparison (2+ units) renders.
  const compareViewFired = useRef(false);
  useEffect(() => {
    if (compareViewFired.current || items.length < 2) return;
    compareViewFired.current = true;
    trackEvent(ANALYTICS_EVENTS.COMPARE_VIEW, { item_count: items.length });
  }, [items.length]);

  function removeUnit(id: CompareUnitId) {
    const next = removeCompareId(compareIds, id);
    setCompareIds(next);
    setStoredCompareIds(next);
    if (next.length === 0) {
      // Keep AR users on /ar/compare (not bare EN hub).
      router.push(localePath(locale, "/compare"));
      return;
    }
    router.push(
      `${localePath(locale, "/compare")}?units=${encodeURIComponent(serializeCompareIds(next))}`,
    );
  }

  return (
    <PageShell headerVariant="transparent" showCurrency>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">
            {dict.compare.heroTitleLead} <em className="italic">{dict.compare.heroTitleEm}</em>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            {dict.compare.heroSubtitle}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.common.compare },
          ]}
        />
        {loading && compareIds.length > 0 && items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface-alt p-10 text-center">
            <p className="text-sm text-muted">{dict.compare.loadingData}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-alt p-10 text-center">
            <p className="text-lg font-medium text-text-dark">{dict.compare.emptyTitle}</p>
            <p className="mt-2 text-sm text-muted">
              {dict.compare.emptyBody}
            </p>
            <PrimaryButton href="/projects" className="mt-6">
              {dict.compare.addProperty}
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-3">
              <PrimaryButton href="/projects">{dict.compare.addProperty}</PrimaryButton>
              <Link
                href={localePath(locale, "/projects")}
                className="text-sm font-semibold text-brand hover:text-brand-dark"
              >
                {dict.compare.done}
              </Link>
            </div>

            <CompareSummaryStrip
              items={items}
              stats={initialStats}
              currency={currency}
              labels={{
                bestValue: dict.compare.bestValue,
                highestYield: dict.compare.highestYield,
                earliestHandover: dict.compare.earliestHandover,
                lowestEntry: dict.compare.lowestEntry,
                grossPct: dict.compare.grossPct,
                perSqftSuffix: `/${dict.format.sqft.replace("{value}", "").trim() || "sqft"}`,
              }}
            />

            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm max-md:snap-x max-md:snap-proximity"
            >
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/60">
                    <th
                      className={cn(
                        "w-36 p-4 text-start text-xs font-semibold uppercase tracking-wide text-muted",
                        STICKY_LABEL_CLASS,
                      )}
                    >
                      {dict.compare.attribute}
                    </th>
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const unitId =
                          `${item.project.id}:${item.unit.id}` as CompareUnitId;

                        return (
                          <motion.th
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={unitId}
                            className="min-w-[220px] snap-start border-s border-border p-4 text-start align-top"
                          >
                            <Link
                              href={localePath(locale, `/projects/${item.project.slug}`)}
                              className="group block"
                            >
                              <DeveloperAttribution
                                name={item.project.developer}
                                logoUrl={item.project.developerLogo ?? item.catalog?.developerLogo}
                              />
                              <p className="mt-1 font-semibold text-text-dark group-hover:text-brand">
                                {item.project.name}
                              </p>
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeUnit(unitId)}
                              className="iop-btn-press mt-3 text-xs font-semibold text-brand hover:text-brand-dark"
                            >
                              {dict.compare.remove}
                            </button>
                            <Link
                              href={localePath(locale, `/projects/${item.project.slug}`)}
                              className="mt-2 flex w-full items-center justify-between rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                            >
                              {dict.compare.viewProperty}
                              <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 10h12M10 4l6 6-6 6" /></svg>
                            </Link>
                          </motion.th>
                        );
                      })}
                    </AnimatePresence>
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <th
                        key={`empty-${i}`}
                        className="min-w-[200px] border-s border-dashed border-border p-4 text-start align-top"
                      >
                        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-surface-alt/50">
                          <PrimaryButton
                            href="/projects"
                            className="px-4 py-2 text-xs"
                          >
                            {dict.compare.addProperty}
                          </PrimaryButton>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <th
                      scope="row"
                      className={cn("p-4 text-start font-medium text-muted", STICKY_LABEL_CLASS)}
                    >
                      {dict.compare.gallery}
                    </th>
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const galleryImages = getProjectGalleryImages(
                          item.project,
                          item.catalog,
                        );
                        return (
                          <motion.td
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={`${compareUnitKey(item)}-gallery`}
                            className="border-s border-border p-4 align-top"
                          >
                            <div className="relative h-40 overflow-hidden rounded-xl">
                              <CompactMediaGallery
                                images={galleryImages}
                                alt={item.project.name}
                                projectHref={`/projects/${item.project.slug}`}
                                fallbackClassName={cn(
                                  "bg-gradient-to-br",
                                  item.project.imageGradient,
                                )}
                                sizes="220px"
                                className="rounded-xl"
                              />
                            </div>
                          </motion.td>
                        );
                      })}
                    </AnimatePresence>
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td
                        key={`empty-gallery-${i}`}
                        className="border-s border-dashed border-border p-4 text-muted"
                      >
                        —
                      </td>
                    ))}
                  </tr>
                  {ROWS.map((row) => {
                    const winnerKey =
                      row.num && row.better
                        ? pickWinner(
                            items.map((item) => ({
                              key: compareUnitKey(item),
                              value: row.num!(item, initialStats[item.project.id]),
                            })),
                            row.better,
                          )
                        : null;
                    return (
                    <tr key={row.label} className="border-t border-border">
                      <th
                        scope="row"
                        className={cn("p-4 text-start font-medium text-muted", STICKY_LABEL_CLASS)}
                      >
                        {row.label}
                        {row.hint ? (
                          <span className="block text-xs font-normal text-muted-light">
                            {row.hint}
                          </span>
                        ) : null}
                      </th>
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => {
                          const wins = winnerKey === compareUnitKey(item);
                          return (
                            <motion.td
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              key={`${item.project.id}:${item.unit.id}-${row.label}`}
                              className={cn(
                                "border-s border-border p-4 tabular-nums",
                                wins
                                  ? "font-bold text-brand"
                                  : "font-medium text-text-dark",
                              )}
                            >
                              {row.render(item, currency, initialStats[item.project.id])}
                              {wins ? <span className="ms-1 text-xs">▲</span> : null}
                            </motion.td>
                          );
                        })}
                      </AnimatePresence>
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <td
                          key={`empty-${row.label}-${i}`}
                          className="border-s border-dashed border-border p-4 text-muted"
                        >
                          —
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {items.length >= 2 ? (
              <div
                className="mt-3 flex items-center justify-center gap-1.5 md:hidden"
                aria-hidden
              >
                {items.map((item, i) => (
                  <span
                    key={compareUnitKey(item)}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      i === scrollDot ? "bg-brand" : "bg-border",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>
    </PageShell>
  );
}
