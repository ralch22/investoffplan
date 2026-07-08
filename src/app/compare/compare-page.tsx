"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrimaryButton } from "@/components/ui/primary-button";
import { removeCompareId, serializeCompareIds } from "@/lib/compare";
import { setStoredCompareIds } from "@/lib/compare-storage";
import type { CompareUnitId } from "@/lib/compare";
import { useCatalog, type FlatUnit } from "@/lib/catalog-browser";
import {
  cityLabel,
  formatBeds,
  formatPrice,
  formatSqft,
} from "@/lib/format";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import { resolveBrochureUrl } from "@/lib/brochure";
import { CompactMediaGallery } from "@/components/compact-media-gallery";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { getProjectGalleryImages } from "@/lib/project-gallery-images";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/lib/types";

interface ComparePageProps {
  initialIds: CompareUnitId[];
  initialItems: FlatUnit[];
}

const ROWS: Array<{
  label: string;
  render: (item: FlatUnit, currency: CurrencyCode) => React.ReactNode;
}> = [
  { label: "Property type", render: (item) => item.unit.propertyType },
  {
    label: "Starting price",
    render: (item, currency) => formatPrice(item.unit.launchPriceAed, currency),
  },
  { label: "Payment plan", render: (item) => item.project.paymentPlan },
  { label: "Handover", render: (item) => item.project.handover ?? "TBC" },
  { label: "Bedrooms", render: (item) => formatBeds(item.unit.beds) },
  {
    label: "Square footage",
    render: (item) => formatSqft(item.unit.sqftMin, item.unit.sqftMax),
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

export function ComparePage({ initialIds, initialItems }: ComparePageProps) {
  const { api, loading } = useCatalog();
  const [currency, setCurrency] = useState<CurrencyCode>("AED");
  const router = useRouter();
  const [compareIds, setCompareIds] = useState<CompareUnitId[]>(initialIds);
  const items = useMemo(() => {
    if (!isApiMode && api) return api.resolveCompareUnits(compareIds);
    return initialItems.filter(item => 
      compareIds.includes(`${item.project.id}:${item.unit.id}` as CompareUnitId)
    );
  }, [isApiMode, api, compareIds, initialItems]);
  const emptySlots = Math.max(0, MAX_SLOTS - items.length);

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
    <PageShell
      currency={currency}
      onCurrencyChange={setCurrency}
      headerVariant="transparent"
    >
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

            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/60">
                    <th className="w-36 p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      Attribute
                    </th>
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const galleryImages = getProjectGalleryImages(
                          item.project,
                          item.catalog,
                        );
                        const unitId =
                          `${item.project.id}:${item.unit.id}` as CompareUnitId;

                        return (
                          <motion.th
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={unitId}
                            className="min-w-[220px] border-l border-border p-4 text-left align-top"
                          >
                            <div className="relative mb-3 h-36 overflow-hidden rounded-xl">
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
                        className="min-w-[200px] border-l border-dashed border-border p-4 text-left align-top"
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
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="p-4 font-medium text-muted">{row.label}</td>
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                          <motion.td
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={`${item.project.id}:${item.unit.id}-${row.label}`}
                            className="border-l border-border p-4 font-medium text-text-dark"
                          >
                            {row.render(item, currency)}
                          </motion.td>
                        ))}
                      </AnimatePresence>
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <td
                          key={`empty-${row.label}-${i}`}
                          className="border-l border-dashed border-border p-4 text-muted"
                        >
                          —
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}