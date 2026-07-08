import "server-only";

import { getDevelopers, getCatalogApi } from "./catalog";
import { pricePerSqft } from "./investment-metrics";
import { resolveBrochureUrl } from "./brochure";

export async function getCatalogAnalytics() {
  const api = await getCatalogApi();
  const prices = api.units.map((u) => u.launchPriceAed);
  const ppsfValues = api.units.map((u) =>
    pricePerSqft(u.launchPriceAed, u.sqftMin),
  ).filter((v): v is number => v != null);

  const brochureCount = api.projects.filter((p) => resolveBrochureUrl(p)).length;
  const videoCount = api.projects.filter((p) => p.videoAvailable || p.videoUrl).length;
  const premiumCount = api.units.filter((u) => u.isPremium).length;
  const withCoords = api.projects.filter((p) => p.coordinates).length;
  const withAmenities = api.projects.filter((p) => p.amenities?.length).length;

  const cityPrices = new Map<string, number[]>();
  for (const u of api.units) {
    const list = cityPrices.get(u.citySlug) ?? [];
    list.push(u.launchPriceAed);
    cityPrices.set(u.citySlug, list);
  }

  const cityAvg = [...cityPrices.entries()]
    .map(([slug, vals]) => ({
      slug,
      avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      count: vals.length,
    }))
    .sort((a, b) => b.count - a.count);

  const handoverBuckets = { "2026": 0, "2027": 0, "2028": 0, "2029+": 0 };
  for (const p of api.projects) {
    const y = p.handover?.match(/(\d{4})/)?.[1];
    if (!y) continue;
    const yr = Number(y);
    if (yr <= 2026) handoverBuckets["2026"]++;
    else if (yr === 2027) handoverBuckets["2027"]++;
    else if (yr === 2028) handoverBuckets["2028"]++;
    else handoverBuckets["2029+"]++;
  }

  const developers = await getDevelopers();

  return {
    unitCount: api.meta.unitCount,
    projectCount: api.meta.projectCount,
    developerCount: developers.length,
    brochureCount,
    brochurePct: Math.round((brochureCount / api.projects.length) * 100),
    videoCount,
    premiumCount,
    withCoords,
    withAmenities,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((s, v) => s + v, 0) / prices.length),
    avgPpsf: ppsfValues.length
      ? Math.round(ppsfValues.reduce((s, v) => s + v, 0) / ppsfValues.length)
      : 0,
    cityAvg,
    handoverBuckets,
    scrapedAt: api.meta.scrapedAt,
  };
}

export function getAdvantageMatrix(unitCount?: number) {
  return [
    {
      feature: `Unit-level SERP (${unitCount ? unitCount.toLocaleString("en-US") : "2,000+"} options)`,
      pf: true,
      opr: false,
      iop: true,
    },
    {
      feature: "Brochure on every listing",
      pf: false,
      opr: true,
      iop: true,
    },
    {
      feature: "Compare up to 3 units",
      pf: false,
      opr: false,
      iop: true,
    },
    {
      feature: "Price per sqft intelligence",
      pf: false,
      opr: false,
      iop: true,
    },
    {
      feature: "Interactive project map",
      pf: true,
      opr: true,
      iop: true,
    },
    {
      feature: "Payment plan calculator",
      pf: false,
      opr: true,
      iop: true,
    },
    {
      feature: "Instant filters (no reload)",
      pf: false,
      opr: false,
      iop: true,
    },
    {
      feature: "Full amenities per project",
      pf: true,
      opr: false,
      iop: true,
    },
    {
      feature: "Multi-emirate coverage",
      pf: true,
      opr: false,
      iop: true,
    },
  ];
}