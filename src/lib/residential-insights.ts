import "server-only";

import { getCatalogApi } from "./catalog";
import { pricePerSqft } from "./investment-metrics";

export interface ResidentialBuilding {
  slug: string;
  name: string;
  developer: string;
  area: string;
  areaSlug: string;
  city: string;
  minPriceAed: number;
  maxPriceAed: number;
  avgPriceAed: number;
  avgPpsf: number | null;
  unitCount: number;
  bedBands: string[];
  handover?: string;
  imageUrl?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function bedLabel(beds: number): string {
  if (beds === 0) return "Studio";
  return `${beds} BR`;
}

export async function getResidentialBuildings(options?: {
  city?: string;
  areaSlug?: string;
  query?: string;
  limit?: number;
}): Promise<ResidentialBuilding[]> {
  const api = await getCatalogApi();
  const limit = options?.limit ?? 200;
  const q = options?.query?.trim().toLowerCase();

  const buildings: ResidentialBuilding[] = [];

  for (const project of api.projects) {
    if (options?.city && project.city !== options.city) continue;
    const areaSlug = slugify(project.area);
    if (options?.areaSlug && areaSlug !== options.areaSlug) continue;
    if (q) {
      const hay = `${project.name} ${project.developer} ${project.area}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }

    const prices = project.units.map((u) => u.launchPriceAed);
    if (!prices.length) continue;

    const ppsfValues = project.units
      .map((u) => pricePerSqft(u.launchPriceAed, u.sqftMin))
      .filter((v): v is number => v != null);

    const beds = [...new Set(project.units.map((u) => u.beds))].sort((a, b) => a - b);

    buildings.push({
      slug: project.slug,
      name: project.name,
      developer: project.developer,
      area: project.area,
      areaSlug,
      city: project.city,
      minPriceAed: Math.min(...prices),
      maxPriceAed: Math.max(...prices),
      avgPriceAed: Math.round(prices.reduce((s, v) => s + v, 0) / prices.length),
      avgPpsf: ppsfValues.length
        ? Math.round(ppsfValues.reduce((s, v) => s + v, 0) / ppsfValues.length)
        : null,
      unitCount: project.units.length,
      bedBands: beds.map(bedLabel),
      handover: project.handover,
      imageUrl: project.imageUrl,
    });
  }

  return buildings
    .sort((a, b) => b.unitCount - a.unitCount)
    .slice(0, limit);
}

export async function getComparableBuildings(
  slug: string,
  limit = 4,
): Promise<ResidentialBuilding[]> {
  const all = await getResidentialBuildings();
  const target = all.find((b) => b.slug === slug);
  if (!target) return [];

  return all
    .filter(
      (b) =>
        b.slug !== slug &&
        b.areaSlug === target.areaSlug &&
        Math.abs(b.avgPriceAed - target.avgPriceAed) < target.avgPriceAed * 0.35,
    )
    .slice(0, limit);
}