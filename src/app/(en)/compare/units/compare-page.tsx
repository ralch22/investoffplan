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
  formatSqft,
  propertyTypeLabel,
} from "@/lib/format";
import { useI18n } from "@/i18n/locale-provider";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import {
  compareMonthlyPaymentAed,
  compareUnitKey,
  pickWinner,
  type CompareAreaStats,
  type CompareStatsMap,
} from "@/lib/compare-stats";
import { resolveBrochureUrl } from "@/lib/brochure";
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

// ROWS without locale-sensitive fields — merged with dynamic rows in component.
const BASE_ROWS: CompareRow[] = [
  // "Property type" and "Bedrooms" rows are injected per-render (locale-aware).
  {
    label: "Starting price",
    render: (item, currency) => formatPrice(item.unit.launchPriceAed, currency),
    num: (item) => (item.unit.launchPriceAed > 0 ? item.unit.launchPriceAed : null),
    better: "lower",
  },
  {
    label: "Payment plan",
    render: (item) => (
      <>
        <span>{item.project.paymentPlan}</span>
        <PaymentPlanBar plan={item.project.paymentPlan} />
      </>
    ),
  },
  { label: "Handover", render: (item) => item.project.handover ?? "TBC" },
  // "Bedrooms" row injected per-render below (locale-aware).
  {
    label: "Square footage",
    render: (item) => formatSqft(item.unit.sqftMin, item.unit.sqftMax),
    num: (item) => (item.unit.sqftMin > 0 ? item.unit.sqftMin : null),
    better: "higher",
  },
  {
    label: "Location",
    render: (item) => `${cityLabel(item.project.city)}, ${item.project.area}`,
  },
  {
    label: "AED / sqft",
    render: (item) => {
      const v = unitPricePerSqft(item);
      return v ? `AED ${v.toLocaleString()}` : "—";
    },
    num: (item) => unitPricePerSqft(item),
    better: "lower",
  },
  {
    label: "Gross yield",
    hint: "community-level · DLD 2025",
    render: (_item, _currency, stats) =>
      stats?.grossYieldPct != null ? `${stats.grossYieldPct}%` : "—",
    num: (_item, stats) => stats?.grossYieldPct ?? null,
    better: "higher",
  },
  {
    label: "Est. monthly payment",
    hint: "80% loan · 4.25% · 25y",
    render: (item, currency) => {
      const monthly = compareMonthlyPaymentAed(item);
      return monthly != null ? `${formatPrice(monthly, currency)}/mo` : "—";
    },
    num: (item) => compareMonthlyPaymentAed(item),
    better: "lower",
  },
  {
    label: "Brochure",
    render: (item) => (resolveBrochureUrl(item.project) ? "PDF ready" : "On request"),
  },
  {
    label: "Amenities",
    render: (item) => {
      const ams = item.project.amenities;
      if (!ams || ams.length === 0) return "—";
      return (
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          {ams.slice(0, 5).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
          {ams.length > 5 && <li>+{ams.length - 5} more</li>}
        </ul>
      );
    },
  },
];

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
  const ROWS: CompareRow[] = [
    { label: "Property type", render: (item) => propertyTypeLabel(item.unit.propertyType, dict, locale) },
    ...BASE_ROWS.slice(0, 3),
    { label: "Bedrooms", render: (item) => bedsLabel(item.unit.beds, dict) },
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
      router.push("/compare");
      return;
    }
    router.push(`/compare?units=${encodeURIComponent(serializeCompareIds(next))}`);
  }

  return (
    <PageShell headerVariant="transparent" showCurrency>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">
            Compare <em className="italic">Projects.</em>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Side-by-side unit intelligence — price, handover, brochures, and payment plans.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Compare" },
          ]}
        />
        {loading && compareIds.length > 0 && items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface-alt p-10 text-center">
            <p className="text-sm text-muted">Loading compare data…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-alt p-10 text-center">
            <p className="text-lg font-medium text-text-dark">Nothing to compare yet</p>
            <p className="mt-2 text-sm text-muted">
              Select up to 3 units on the projects page.
            </p>
            <PrimaryButton href="/projects" className="mt-6">
              Add property
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-3">
              <PrimaryButton href="/projects">Add property</PrimaryButton>
              <Link
                href="/projects"
                className="text-sm font-semibold text-brand hover:text-brand-dark"
              >
                Done
              </Link>
            </div>

            <CompareSummaryStrip
              items={items}
              stats={initialStats}
              currency={currency}
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
                      Attribute
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
                              href={`/projects/${item.project.slug}`}
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
                              Remove
                            </button>
                            <Link
                              href={`/projects/${item.project.slug}`}
                              className="mt-2 flex w-full items-center justify-between rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                            >
                              View Property
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
                            Add property
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
                      Gallery
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
