import "server-only";

import { getArea, getProjectsByArea } from "@/lib/catalog";
import { areaTagline } from "@/lib/figma-copy";
import { getAreaImage } from "@/lib/area-images";

export interface AreaInsights {
  slug: string;
  name: string;
  cityLabel: string;
  tagline: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  avgPriceAed: number;
  heroImage?: string;
}

export async function getAreaInsightsForProject(
  areaSlug: string,
): Promise<AreaInsights | null> {
  const area = await getArea(areaSlug);
  if (!area) return null;

  const projects = await getProjectsByArea(areaSlug);
  // Ignore unstated 0 prices so "From AED 0" never surfaces on the PDP band.
  const prices = projects
    .flatMap((p) => p.units.map((u) => u.launchPriceAed))
    .filter((p) => p > 0);
  const avgPriceAed =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : area.minPriceAed > 0
        ? area.minPriceAed
        : 0;
  const minPriceAed =
    prices.length > 0
      ? Math.min(...prices)
      : area.minPriceAed > 0
        ? area.minPriceAed
        : 0;

  const heroImage = await getAreaImage(area.name);

  return {
    slug: area.slug,
    name: area.name,
    cityLabel: area.cityLabel,
    tagline: areaTagline(area.slug, area.name),
    projectCount: area.projectCount,
    unitCount: area.unitCount,
    minPriceAed,
    avgPriceAed,
    heroImage,
  };
}