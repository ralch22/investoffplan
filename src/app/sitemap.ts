import type { MetadataRoute } from "next";
import { getAreas, getDevelopers, getCatalogApi } from "@/lib/catalog";
import { GUIDE_CARDS } from "@/lib/figma-copy";

let base: string = process.env.NEXT_PUBLIC_SITE_URL ?? "https://investoffplan-preview.emerge-digital.workers.dev";
if (!base || base.includes("preview") || base.includes("emerge-digital")) {
  base = "https://investoffplan.com";
}
const BASE = base;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const api = await getCatalogApi();
  const catalogUpdated = new Date(api.meta.scrapedAt);

  const staticRoutes = [
    "",
    "/projects",
    "/developers",
    "/areas",
    "/insights",
    "/compare",
    "/map",
    "/contact",
    "/about",
    "/news",
    "/favorites",
    "/tools",
    "/tools/price-map",
    "/tools/communities",
    "/tools/rent-vs-buy",
    "/tools/residential",
    "/tools/payment",
    "/privacy-policy",
    "/cookie-policy",
  ].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: catalogUpdated,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const projectRoutes = api.projects.map((p) => ({
    url: `${BASE}/projects/${p.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const developers = await getDevelopers();
  const developerRoutes = developers.map((d) => ({
    url: `${BASE}/developers/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const areas = await getAreas();
  const areaRoutes = areas.map((a) => ({
    url: `${BASE}/areas/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const guideRoutes = GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => ({
    url: `${BASE}${g.href}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...projectRoutes, ...developerRoutes, ...areaRoutes, ...guideRoutes];
}