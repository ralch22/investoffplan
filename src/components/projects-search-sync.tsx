"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ProjectFilters as Filters, CollectionFilter, CitySlug } from "@/lib/types";

interface ProjectsSearchSyncProps {
  filters: Filters;
  collection: CollectionFilter;
  onSync: (filters: Filters, collection: CollectionFilter) => void;
}

export function ProjectsSearchSync({ filters, collection, onSync }: ProjectsSearchSyncProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useRef(false);

  // Initial read from URL
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    
    let hasUpdates = false;
    const newFilters = { ...filters };
    let newCollection = collection;

    const q = searchParams.get("q") ?? searchParams.get("query");
    if (q) { newFilters.query = q; hasUpdates = true; }

    const c = searchParams.get("collection");
    if (c) { newCollection = c as CollectionFilter; hasUpdates = true; }
    
    const city = searchParams.get("city");
    if (city) { newFilters.city = city as CitySlug; hasUpdates = true; }

    const beds = searchParams.get("beds");
    if (beds) { newFilters.beds = beds === "all" || beds === "studio" ? beds : Number(beds); hasUpdates = true; }

    const propType = searchParams.get("type");
    if (propType) { newFilters.propertyType = propType as any; hasUpdates = true; }
    
    const minP = searchParams.get("minP");
    if (minP) { newFilters.minPrice = Number(minP); hasUpdates = true; }

    const maxP = searchParams.get("maxP");
    if (maxP) { newFilters.maxPrice = Number(maxP); hasUpdates = true; }

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

    if (hasUpdates) {
      onSync(newFilters, newCollection);
    }
  }, [searchParams, filters, collection, onSync]);

  // Write to URL on changes
  useEffect(() => {
    if (!mounted.current) return;
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (collection !== "all") params.set("collection", collection);
    if (filters.city !== "all") params.set("city", filters.city);
    if (filters.beds !== "all") params.set("beds", String(filters.beds));
    if (filters.propertyType !== "all") params.set("type", filters.propertyType);
    if (filters.minPrice) params.set("minP", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxP", String(filters.maxPrice));
    if (filters.developer !== "all") params.set("dev", filters.developer);
    if (filters.paymentPlan !== "all") params.set("pay", filters.paymentPlan);
    if (filters.handoverBy !== "all") params.set("handover", String(filters.handoverBy));
    if (filters.amenities.length > 0) params.set("amen", filters.amenities.join(","));
    
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    
    if (newSearch !== currentSearch) {
      router.replace(`${pathname}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    }
  }, [filters, collection, pathname, router, searchParams]);

  return null;
}