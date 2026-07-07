import "server-only";

import { getAreas } from "./catalog";
import { inferLifestyles, type LifestyleSlug } from "./community-lifestyles";
import type { CommunityInsightArea } from "./community-insights-shared";

export type { CommunityInsightArea } from "./community-insights-shared";

export async function getCommunityInsights(): Promise<CommunityInsightArea[]> {
  const areas = await getAreas();
  return areas.map((area) => ({
    slug: area.slug,
    name: area.name,
    cityLabel: area.cityLabel,
    projectCount: area.projectCount,
    unitCount: area.unitCount,
    minPriceAed: area.minPriceAed,
    lifestyles: inferLifestyles(area.slug, area.name),
  }));
}

export async function getAreasByLifestyle(
  lifestyle: LifestyleSlug,
): Promise<CommunityInsightArea[]> {
  const all = await getCommunityInsights();
  return all
    .filter((a) => a.lifestyles.includes(lifestyle))
    .sort((a, b) => b.projectCount - a.projectCount);
}