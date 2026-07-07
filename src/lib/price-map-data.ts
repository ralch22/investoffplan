import "server-only";

import { getAreas, getCatalogApi } from "./catalog";
import { cityLabel } from "./format";
import { pricePerSqft } from "./investment-metrics";
import type { PropertyType } from "./types";
import type { AreaPricePoint } from "./price-map-shared";

export type { AreaPricePoint } from "./price-map-shared";

export interface PriceMapFilters {
  city?: string;
  beds?: number | null;
  propertyType?: PropertyType | "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAreaPricePoints(
  filters: PriceMapFilters = {},
): Promise<AreaPricePoint[]> {
  const api = await getCatalogApi();
  const areas = await getAreas();
  const areaMeta = new Map(areas.map((a) => [a.slug, a]));

  const buckets = new Map<
    string,
    {
      prices: number[];
      ppsf: number[];
      coords: { lat: number; lng: number }[];
      projectIds: Set<string>;
    }
  >();

  for (const project of api.projects) {
    if (filters.city && project.city !== filters.city) continue;

    const areaSlug = slugify(project.area);
    const bucket = buckets.get(areaSlug) ?? {
      prices: [],
      ppsf: [],
      coords: [],
      projectIds: new Set<string>(),
    };

    for (const unit of project.units) {
      if (filters.beds != null && unit.beds !== filters.beds) continue;
      if (filters.propertyType && unit.propertyType !== filters.propertyType) continue;

      bucket.prices.push(unit.launchPriceAed);
      const ppsf = pricePerSqft(unit.launchPriceAed, unit.sqftMin);
      if (ppsf) bucket.ppsf.push(ppsf);
    }

    if (project.coordinates) {
      bucket.coords.push(project.coordinates);
    }
    bucket.projectIds.add(project.id);
    buckets.set(areaSlug, bucket);
  }

  const points: AreaPricePoint[] = [];

  for (const [slug, bucket] of buckets) {
    if (bucket.prices.length === 0) continue;

    const meta = areaMeta.get(slug);
    const avgLat =
      bucket.coords.length > 0
        ? bucket.coords.reduce((s, c) => s + c.lat, 0) / bucket.coords.length
        : 25.15;
    const avgLng =
      bucket.coords.length > 0
        ? bucket.coords.reduce((s, c) => s + c.lng, 0) / bucket.coords.length
        : 55.28;

    const avgPrice = Math.round(
      bucket.prices.reduce((s, v) => s + v, 0) / bucket.prices.length,
    );
    const avgPpsf = bucket.ppsf.length
      ? Math.round(bucket.ppsf.reduce((s, v) => s + v, 0) / bucket.ppsf.length)
      : null;

    points.push({
      slug,
      name: meta?.name ?? slug.replace(/-/g, " "),
      city: meta?.city ?? "dubai",
      cityLabel: meta?.cityLabel ?? cityLabel("dubai"),
      lat: avgLat,
      lng: avgLng,
      avgPriceAed: avgPrice,
      minPriceAed: Math.min(...bucket.prices),
      maxPriceAed: Math.max(...bucket.prices),
      avgPpsf,
      unitCount: bucket.prices.length,
      projectCount: bucket.projectIds.size,
    });
  }

  return points.sort((a, b) => b.unitCount - a.unitCount);
}