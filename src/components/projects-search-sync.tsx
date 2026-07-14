"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type {
  ProjectFilters as Filters,
  CollectionFilter,
  CitySlug,
  SortOption,
} from "@/lib/types";

const SORT_OPTIONS: readonly SortOption[] = [
  "featured",
  "price-asc",
  "price-desc",
  "value-asc",
  "handover-asc",
  "handover-desc",
];

function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value);
}

interface ProjectsSearchSyncProps {
  filters: Filters;
  collection: CollectionFilter;
  page: number;
  sort: SortOption;
  fixedCollection?: CollectionFilter;
  onSync: (
    filters: Filters,
    collection: CollectionFilter,
    page: number,
    sort: SortOption,
  ) => void;
}

export function ProjectsSearchSync({
  filters,
  collection,
  page,
  sort,
  fixedCollection,
  onSync,
}: ProjectsSearchSyncProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);
  const skipFirstWrite = useRef(true);

  // Initial read from URL
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    
    let hasUpdates = false;
    const newFilters = { ...filters };
    let newCollection = collection;
    let newPage = page;
    let newSort = sort;

    const q = searchParams.get("q") ?? searchParams.get("query");
    if (q) { newFilters.query = q; hasUpdates = true; }

    const c = searchParams.get("collection");
    if (!fixedCollection && c) { newCollection = c as CollectionFilter; hasUpdates = true; }
    
    const city = searchParams.get("city");
    if (city) { newFilters.city = city as CitySlug; hasUpdates = true; }

    const beds = searchParams.get("beds");
    if (beds === "all" || beds === "studio") {
      newFilters.beds = beds;
      hasUpdates = true;
    } else if (beds) {
      // Guard against ?beds=abc → NaN silently poisoning the filter.
      const n = Number(beds);
      if (Number.isFinite(n) && n >= 0) { newFilters.beds = n; hasUpdates = true; }
    }

    const propType = searchParams.get("type");
    if (propType) { newFilters.propertyType = propType as any; hasUpdates = true; }

    const minP = searchParams.get("minP");
    if (minP) {
      const n = Number(minP);
      if (Number.isFinite(n) && n > 0) { newFilters.minPrice = n; hasUpdates = true; }
    }

    const maxP = searchParams.get("maxP");
    if (maxP) {
      const n = Number(maxP);
      if (Number.isFinite(n) && n > 0) { newFilters.maxPrice = n; hasUpdates = true; }
    }

    const dev = searchParams.get("dev");
    if (dev) { newFilters.developer = dev; hasUpdates = true; }

    const pay = searchParams.get("pay");
    if (pay === "post-handover" || pay === "multiple") {
      newFilters.paymentPlan = pay;
      hasUpdates = true;
    }

    const handover = searchParams.get("handover");
    if (handover && Number.isFinite(Number(handover))) {
      newFilters.handoverBy = Number(handover);
      hasUpdates = true;
    }

    const amen = searchParams.get("amen");
    if (amen) {
      newFilters.amenities = amen.split(",").map((a) => a.trim()).filter(Boolean);
      hasUpdates = true;
    }

    const pageParam = searchParams.get("page");
    if (pageParam) {
      const n = Number(pageParam);
      // Positive int only; clamp ≥1 so ?page=0 / ?page=-3 / ?page=abc never
      // poison pagination.
      if (Number.isInteger(n) && n >= 1) { newPage = n; hasUpdates = true; }
    }

    const sortParam = searchParams.get("sort");
    if (sortParam && isSortOption(sortParam)) {
      newSort = sortParam;
      hasUpdates = true;
    }

    if (hasUpdates) {
      onSync(newFilters, newCollection, newPage, newSort);
    }
  }, [searchParams, filters, collection, page, sort, fixedCollection, onSync]);

  // Write to URL on changes
  useEffect(() => {
    if (!mounted.current) return;
    // On the first commit the read effect has already set mounted=true but the
    // onSync state update hasn't applied yet, so `filters` still holds defaults.
    // Writing here would strip deep-link params (e.g. ?city=dubai) before the
    // synced state lands. Skip exactly one write; the post-sync re-render writes
    // the correct (already-matching) params as a no-op.
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (!fixedCollection && collection !== "all") params.set("collection", collection);
    if (filters.city !== "all") params.set("city", filters.city);
    if (filters.beds !== "all") params.set("beds", String(filters.beds));
    if (filters.propertyType !== "all") params.set("type", filters.propertyType);
    if (filters.minPrice) params.set("minP", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxP", String(filters.maxPrice));
    if (filters.developer !== "all") params.set("dev", filters.developer);
    if (filters.paymentPlan !== "all") params.set("pay", filters.paymentPlan);
    if (filters.handoverBy !== "all") params.set("handover", String(filters.handoverBy));
    if (filters.amenities.length > 0) params.set("amen", filters.amenities.join(","));
    // Only serialize non-default page/sort so the clean default URL stays clean.
    if (page > 1) params.set("page", String(page));
    if (sort !== "featured") params.set("sort", sort);

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    // Compare against live URL rather than `searchParams` to avoid including
    // searchParams in deps (that would re-trigger this effect on every
    // router.replace, causing a redundant re-run after each URL write).
    if (newSearch !== new URLSearchParams(window.location.search).toString()) {
      router.replace(`${pathname}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    }
  }, [filters, collection, page, sort, pathname, router, fixedCollection]);

  return null;
}