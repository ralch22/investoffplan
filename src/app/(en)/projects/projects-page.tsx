"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { ProjectFilters } from "@/components/project-filters";
import { CityChips } from "@/components/city-chips";
import { SortSelect } from "@/components/sort-select";
import { CompareBar } from "@/components/compare-bar";
import { ProjectCard } from "@/components/project-card";
import { Pagination } from "@/components/pagination";
import { MobileFilterSheet } from "@/components/mobile-filter-sheet";
import { DeveloperSpotlight } from "@/components/developer-spotlight";
import { KnownDevelopers } from "@/components/known-developers";
import { ProjectMap } from "@/components/project-map";
import { CollectionChips } from "@/components/collection-chips";
import { ProjectsSearchSync } from "@/components/projects-search-sync";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import type { CompareUnitId } from "@/lib/compare";
import {
  getStoredCompareIds,
  setStoredCompareIds,
} from "@/lib/compare-storage";
import { PAGE_SIZE, useCatalog, type FlatUnit } from "@/lib/catalog-browser";
import type { MapProject } from "@/lib/map-data";
import { ProjectsSkeleton } from "@/components/projects-skeleton";
import type {
  CitySlug,
  CollectionFilter,
  CurrencyCode,
  ProjectFilters as Filters,
  SortOption,
  ViewMode,
} from "@/lib/types";
import { unoptimizedProp } from "@/lib/asset-image";

const isApiMode = process.env.NEXT_PUBLIC_CATALOG_API === "1";

type CityCount = {
  slug: CitySlug | "all";
  label: string;
  count: number;
};

const DEFAULT_FILTERS: Filters = {
  query: "",
  city: "all",
  propertyType: "all",
  beds: "all",
  minPrice: null,
  maxPrice: null,
  developer: "all",
  paymentPlan: "all",
  handoverBy: "all",
  amenities: [],
};

export interface ProjectsPageMeta {
  unitCount: number;
  projectCount: number;
  scrapedAt: string;
}

interface ProjectsPageProps {
  initialMeta: ProjectsPageMeta;
  initialPageItems: FlatUnit[];
  initialCityCounts: CityCount[];
  initialResultCount: number;
  initialMapProjects?: MapProject[];
  developerOptions?: Array<{ slug: string; name: string }>;
  amenityOptions?: string[];
}

export function ProjectsPage({
  initialMeta,
  initialPageItems,
  initialCityCounts,
  initialResultCount,
  initialMapProjects = [],
  developerOptions = [],
  amenityOptions = [],
}: ProjectsPageProps) {
  const { api, loading, error } = useCatalog();
  const [currency, setCurrency] = useState<CurrencyCode>("AED");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const handleSync = useCallback((syncedFilters: Filters, syncedCollection: CollectionFilter) => {
    setFilters(syncedFilters);
    setCollection(syncedCollection);
    setPage(1);
  }, []);
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<CompareUnitId[]>(getStoredCompareIds);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("unit");
  const [cardLayout, setCardLayout] = useState<"grid" | "list" | "map">("grid");
  const [collection, setCollection] = useState<CollectionFilter>("all");

  const [apiData, setApiData] = useState<{ items: FlatUnit[], meta: any } | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!isApiMode) return;
    setApiLoading(true);
    const url = new URL("/api/catalog/projects", window.location.origin);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("pageSize", PAGE_SIZE.toString());
    url.searchParams.set("view", viewMode);
    url.searchParams.set("sort", sort);
    url.searchParams.set("collection", collection);
    if (filters.query) url.searchParams.set("q", filters.query);
    url.searchParams.set("city", filters.city);
    url.searchParams.set("propertyType", filters.propertyType);
    url.searchParams.set("beds", filters.beds.toString());
    if (filters.minPrice) url.searchParams.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) url.searchParams.set("maxPrice", filters.maxPrice.toString());
    if (filters.developer !== "all") url.searchParams.set("developer", filters.developer);
    if (filters.paymentPlan !== "all") url.searchParams.set("payment", filters.paymentPlan);
    if (filters.handoverBy !== "all")
      url.searchParams.set("handoverBy", String(filters.handoverBy));
    if (filters.amenities.length > 0)
      url.searchParams.set("amenities", filters.amenities.join(","));

    let active = true;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
         if (active) {
            setApiData(data as any);
            setApiLoading(false);
         }
      })
      .catch(() => {
         if (active) setApiLoading(false);
      });
    return () => { active = false; };
  }, [filters, sort, collection, page, viewMode]);

  const cities = useMemo(
    () => api?.getCityCounts() ?? initialCityCounts,
    [api, initialCityCounts],
  );
  const allUnits = useMemo(() => api?.flattenCatalogUnits() ?? [], [api]);

  const isDefaultView =
    filters.city === "all" &&
    filters.query === "" &&
    filters.propertyType === "all" &&
    filters.beds === "all" &&
    filters.minPrice === null &&
    filters.maxPrice === null &&
    filters.developer === "all" &&
    filters.paymentPlan === "all" &&
    filters.handoverBy === "all" &&
    filters.amenities.length === 0 &&
    collection === "all" &&
    sort === "featured" &&
    viewMode === "unit" &&
    page === 1 &&
    cardLayout !== "map";

  const filtered = useMemo(() => {
    if (!api) return [];
    const base = api.applyCollectionFilter(api.filterUnits(allUnits, filters), collection);
    const sorted = api.sortUnits(base, sort);
    return viewMode === "project" ? api.aggregateProjectView(sorted) : sorted;
  }, [api, allUnits, filters, sort, viewMode, collection]);

  const catalogReady = Boolean(api);
  // Before the first API response lands (and in the SSR HTML), fall back to
  // the server-provided defaults so the page never paints "0 results".
  const resultCount = isApiMode
    ? (apiData?.meta?.total ?? (isDefaultView ? initialResultCount : 0))
    : catalogReady
      ? filtered.length
      : isDefaultView
        ? initialResultCount
        : 0;

  const totalPages = isApiMode
    ? (apiData?.meta?.totalPages ??
      (isDefaultView ? Math.max(1, Math.ceil(initialResultCount / PAGE_SIZE)) : 1))
    : catalogReady
      ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
      : isDefaultView
        ? Math.max(1, Math.ceil(initialResultCount / PAGE_SIZE))
        : 1;
  const currentPage = Math.min(page, totalPages);

  const pageItems = isApiMode
    ? (apiData?.items ?? (isDefaultView ? initialPageItems : []))
    : catalogReady
      ? filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
      : isDefaultView
        ? initialPageItems
        : [];

  const heroImage = pageItems[0]?.catalog?.imageUrl ?? pageItems[0]?.project.imageUrl;

  function updateFilters(next: Filters) {
    setFilters(next);
    setPage(1);
  }

  function updateCity(city: CitySlug) {
    updateFilters({ ...filters, city });
  }

  function toggleCompare(id: CompareUnitId) {
    setCompareIds((prev) => {
      const removing = prev.includes(id);
      const atCapacity = !removing && prev.length >= 3;
      const next = removing
        ? prev.filter((x) => x !== id)
        : atCapacity
          ? prev
          : [...prev, id];

      if (!removing && !atCapacity) {
        trackEvent(ANALYTICS_EVENTS.COMPARE_ADD, { unit_id: id });
      }

      setStoredCompareIds(next);
      return next;
    });
  }

  const meta = api?.meta ?? initialMeta;
  const heading =
    viewMode === "unit"
      ? `${meta.unitCount.toLocaleString()} Total unit options in UAE`
      : `${meta.projectCount.toLocaleString()} New off-plan projects in UAE`;

  const locationLabel =
    filters.city !== "all"
      ? cities.find((c) => c.slug === filters.city)?.label
      : "UAE";

  // Suppress the skeleton on first load in the default view — the SSR-provided
  // cards are already on screen and the first API response only confirms them.
  const showCardSkeleton = isApiMode
    ? apiLoading && !(isDefaultView && !apiData && initialPageItems.length > 0)
    : loading && !catalogReady && (!isDefaultView || initialPageItems.length === 0);

  if (error && !api) {
    return (
      <PageShell headerVariant="transparent">
        <section className="relative overflow-hidden bg-surface-dark text-white">
          <div className="absolute inset-0 bg-hero-overlay" />
          <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
            <h1 className="font-display text-4xl font-semibold md:text-5xl">
              Search <em className="italic">Results</em>
            </h1>
          </div>
        </section>
        <main className="mx-auto max-w-[1200px] px-5 py-16 text-center md:px-8">
          <p className="text-lg font-medium text-text-dark">Could not load project catalog</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="iop-btn-press mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Retry
          </button>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell
      currency={currency}
      onCurrencyChange={setCurrency}
      headerVariant="transparent"
    >
      <Suspense fallback={null}>
        <ProjectsSearchSync 
          filters={filters} 
          collection={collection} 
          onSync={handleSync} 
        />
      </Suspense>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            {...unoptimizedProp(heroImage)}
          />
        ) : null}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <h1 className="font-display text-4xl font-semibold md:text-5xl">
            Search <em className="italic">Results</em>
          </h1>
          <p className="mt-3 text-lg text-white/85">
            Properties in {locationLabel}
          </p>
        </div>
      </section>

      <main
        className={cn(
          "mx-auto max-w-[1200px] px-5 py-8 md:px-8",
          compareIds.length > 0 && "max-md:pb-28",
        )}
      >
        <div className="-mt-10 hidden md:block">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-lg">
            <ProjectFilters
              filters={filters}
              onChange={updateFilters}
              developerOptions={developerOptions}
              amenityOptions={amenityOptions}
            />
          </div>
        </div>

        <div className="sticky top-[57px] z-30 -mx-5 border-b border-border bg-white/95 px-5 py-4 backdrop-blur md:static md:mx-0 md:mt-8 md:border-0 md:bg-transparent md:p-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-start text-sm font-medium text-text-dark"
              >
                Filters & search
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text-dark md:text-3xl">
                {heading}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {resultCount.toLocaleString()} results
                {filters.city !== "all" ? ` in ${locationLabel}` : ""}
                {" · "}Updated{" "}
                {new Date(meta.scrapedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setCardLayout("grid")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    cardLayout === "grid"
                      ? "bg-brand text-white"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setCardLayout("list")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    cardLayout === "list"
                      ? "bg-brand text-white"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setCardLayout("map")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    cardLayout === "map"
                      ? "bg-brand text-white"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  Map
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode((v) => (v === "unit" ? "project" : "unit"));
                  setPage(1);
                }}
                className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                {viewMode === "unit" ? "Show project view" : "Show unit view"}
              </button>
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <CityChips cities={cities} value={filters.city} onChange={updateCity} />
          <CollectionChips
            value={collection}
            onChange={(v) => {
              setCollection(v);
              setPage(1);
            }}
          />
        </div>

        <div className="mt-4">
          <CompareBar
            selectedIds={compareIds}
            onClear={() => {
              setCompareIds([]);
              setStoredCompareIds([]);
            }}
          />
        </div>

        {showCardSkeleton ? (
          <ProjectsSkeleton />
        ) : cardLayout === "map" ? (
          <div className="mt-8">
            <ProjectMap initialProjects={initialMapProjects} />
          </div>
        ) : (
          <div
            className={
              cardLayout === "list"
                ? "mt-8 flex flex-col gap-5"
                : "mt-8 flex flex-wrap justify-center gap-5"
            }
          >
            {pageItems.length === 0 ? (
              <div className="w-full rounded-2xl border border-dashed border-border bg-surface-alt p-10 text-center">
                <p className="text-lg font-medium text-text-dark">No units match your filters</p>
                <p className="mt-2 text-sm text-muted">Try clearing beds, price, or city filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setCollection("all");
                    setPage(1);
                  }}
                  className="iop-btn-press mt-6 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              pageItems.map((item, index) => (
                <ProjectCard
                  key={`${item.project.id}:${item.unit.id}`}
                  item={item}
                  currency={currency}
                  compareIds={compareIds}
                  onCompareToggle={toggleCompare}
                  layout={cardLayout}
                  featured={cardLayout === "grid" && index === 0 && currentPage === 1}
                  index={index}
                />
              ))
            )}
          </div>
        )}

        {cardLayout !== "map" ? (
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        ) : null}

        {!showCardSkeleton ? (
          <>
            <DeveloperSpotlight />
            <KnownDevelopers />
          </>
        ) : null}
      </main>

      <MobileFilterSheet
        open={mobileFiltersOpen}
        filters={filters}
        onChange={updateFilters}
        onClose={() => setMobileFiltersOpen(false)}
        developerOptions={developerOptions}
        amenityOptions={amenityOptions}
      />
    </PageShell>
  );
}