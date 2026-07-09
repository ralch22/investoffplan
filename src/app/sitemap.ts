import type { MetadataRoute } from "next";
import { getDevelopers, getCatalogApi } from "@/lib/catalog";
import { getCommunities } from "@/lib/communities";
import { getComparablePairSlugs } from "@/lib/area-compare";
import { getComparableProjectSlugs } from "@/lib/project-compare";
import { getComparableDeveloperSlugs } from "@/lib/developer-compare";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { getNewsArticles } from "@/content/articles";
import { FAQ_TOPICS } from "@/content/faq";
import { COLLECTION_PAGES } from "@/lib/collections";

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
    "/communities",
    "/compare",
    "/compare/units",
    "/guides",
    "/faq",
    "/map",
    "/contact",
    "/about",
    "/news",
    "/favorites",
    "/tools",
    "/tools/price-map",
    "/tools/communities",
    "/tools/rent-vs-buy",
    "/tools/mortgage",
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

  const communities = await getCommunities();
  const areaRoutes = communities.map((c) => ({
    url: `${BASE}/communities/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const comparePairs = await getComparablePairSlugs();
  const compareRoutes = comparePairs.map((pair) => ({
    url: `${BASE}/compare/${pair}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const projectComparePairs = await getComparableProjectSlugs();
  const projectCompareRoutes = projectComparePairs.map((pair) => ({
    url: `${BASE}/compare-projects/${pair}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const developerComparePairs = await getComparableDeveloperSlugs();
  const developerCompareRoutes = developerComparePairs.map((pair) => ({
    url: `${BASE}/compare-developers/${pair}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const guideRoutes = GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => ({
    url: `${BASE}${g.href}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const newsRoutes = getNewsArticles().map((article) => ({
    url: `${BASE}/news/${article.slug}`,
    lastModified: new Date(`${article.publishedAt}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const collectionRoutes = COLLECTION_PAGES.map((page) => ({
    url: `${BASE}/collections/${page.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const faqRoutes = FAQ_TOPICS.map((topic) => ({
    url: `${BASE}/faq/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Arabic mirror — full route tree now exists under /ar.
  const arStaticPaths = [
    "/ar", "/ar/about", "/ar/contact", "/ar/projects", "/ar/communities",
    "/ar/developers", "/ar/guides", "/ar/news", "/ar/faq", "/ar/compare",
    "/ar/tools", "/ar/tools/mortgage", "/ar/tools/payment", "/ar/tools/rent-vs-buy",
    "/ar/tools/communities", "/ar/tools/price-map", "/ar/tools/residential",
  ];
  const arStaticRoutes = arStaticPaths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        en: path === "/ar" ? `${BASE}/` : `${BASE}${path.slice(3)}`,
        ar: `${BASE}${path}`,
      },
    },
  }));
  // AR detail-page mirrors, derived from the EN route arrays.
  const arDetailRoutes = [
    ...projectRoutes, ...areaRoutes, ...developerRoutes, ...guideRoutes,
    ...newsRoutes, ...collectionRoutes, ...faqRoutes, ...compareRoutes,
    ...projectCompareRoutes,
  ].map((r) => ({
    ...r,
    url: r.url.replace(`${BASE}/`, `${BASE}/ar/`),
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...arStaticRoutes,
    ...arDetailRoutes,
    ...projectRoutes,
    ...developerRoutes,
    ...areaRoutes,
    ...compareRoutes,
    ...projectCompareRoutes,
    ...developerCompareRoutes,
    ...guideRoutes,
    ...newsRoutes,
    ...collectionRoutes,
    ...faqRoutes,
  ];
}