import type { MetadataRoute } from "next";
import { getDevelopers, getCatalogApi } from "@/lib/catalog";
import { videoSitemapEntry } from "@/lib/media";
import { getCommunities } from "@/lib/communities";
import { getComparablePairSlugs } from "@/lib/area-compare";
import { getComparableProjectSlugs } from "@/lib/project-compare";
import { getComparableDeveloperSlugs } from "@/lib/developer-compare";
import { LOCATION_GUIDES } from "@/lib/location-guides";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { getNewsArticles } from "@/content/articles";
import { FAQ_TOPICS } from "@/content/faq";
import { COLLECTION_PAGES } from "@/lib/collections";

let base: string = process.env.NEXT_PUBLIC_SITE_URL ?? "https://investoffplan-preview.emerge-digital.workers.dev";
if (!base || base.includes("preview") || base.includes("emerge-digital")) {
  base = "https://investoffplan.com";
}
const BASE = base;

type Entry = MetadataRoute.Sitemap[number];

// Child sitemaps, in id order. Each is its own <urlset> under /sitemap/<id>.xml,
// with /sitemap.xml as the auto-generated <sitemapindex>. Per-type grouping lets
// GSC report indexing coverage per section (projects vs compare vs AR, etc.).
let GROUPS: Entry[][] | null = null;

export async function buildGroups(): Promise<Entry[][]> {
  if (GROUPS) return GROUPS;

  const api = await getCatalogApi();
  const catalogUpdated = new Date(api.meta.scrapedAt);

  const staticRoutes: Entry[] = [
    "", "/projects", "/developers", "/communities", "/compare", "/compare/units",
    "/locations", "/guides", "/faq", "/map", "/contact", "/about", "/news",
    "/favorites", "/tools", "/tools/price-map", "/tools/communities",
    "/tools/rent-vs-buy", "/tools/mortgage", "/tools/residential", "/tools/payment",
    "/privacy-policy", "/cookie-policy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const projectRoutes: Entry[] = api.projects.map((p) => {
    const thumb = p.imageUrl
      ? p.imageUrl.startsWith("http")
        ? p.imageUrl
        : `${BASE}${p.imageUrl.startsWith("/") ? "" : "/"}${p.imageUrl}`
      : "";
    const video = videoSitemapEntry(p.videoUrl, {
      title: `${p.name} — video walkthrough`,
      description: `Video walkthrough of ${p.name} by ${p.developer} in ${p.area}.`,
      thumbnail: thumb,
    });
    return {
      url: `${BASE}/projects/${p.slug}`,
      lastModified: catalogUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(video ? { videos: [video] } : {}),
    };
  });

  const developers = await getDevelopers();
  const developerRoutes: Entry[] = developers.map((d) => ({
    url: `${BASE}/developers/${d.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const communities = await getCommunities();
  const areaRoutes: Entry[] = communities.map((c) => ({
    url: `${BASE}/communities/${c.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const comparePairs = await getComparablePairSlugs();
  const compareRoutes: Entry[] = comparePairs.map((pair) => ({
    url: `${BASE}/compare/${pair}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const projectComparePairs = await getComparableProjectSlugs();
  const projectCompareRoutes: Entry[] = projectComparePairs.map((pair) => ({
    url: `${BASE}/compare-projects/${pair}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const developerComparePairs = await getComparableDeveloperSlugs();
  const developerCompareRoutes: Entry[] = developerComparePairs.map((pair) => ({
    url: `${BASE}/compare-developers/${pair}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const locationGuideRoutes: Entry[] = LOCATION_GUIDES.map((g) => ({
    url: `${BASE}/locations/${g.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const guideRoutes: Entry[] = GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => ({
    url: `${BASE}${g.href}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const newsRoutes: Entry[] = getNewsArticles().map((article) => ({
    url: `${BASE}/news/${article.slug}`,
    lastModified: new Date(`${article.publishedAt}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const collectionRoutes: Entry[] = COLLECTION_PAGES.map((page) => ({
    url: `${BASE}/collections/${page.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const faqRoutes: Entry[] = FAQ_TOPICS.map((topic) => ({
    url: `${BASE}/faq/${topic.slug}`,
    lastModified: catalogUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const arStaticPaths = [
    "/ar", "/ar/about", "/ar/contact", "/ar/projects", "/ar/communities",
    "/ar/developers", "/ar/guides", "/ar/news", "/ar/faq", "/ar/compare", "/ar/locations", "/ar/map",
    "/ar/tools", "/ar/tools/mortgage", "/ar/tools/payment", "/ar/tools/rent-vs-buy",
    "/ar/tools/communities", "/ar/tools/price-map", "/ar/tools/residential",
  ];
  const arStaticRoutes: Entry[] = arStaticPaths.map((path) => ({
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
  // AR detail mirrors, derived from the EN detail arrays (videos dropped — the
  // EN video sitemap is canonical for video discovery).
  const arDetailRoutes: Entry[] = [
    ...projectRoutes, ...areaRoutes, ...developerRoutes, ...guideRoutes,
    ...newsRoutes, ...collectionRoutes, ...faqRoutes, ...compareRoutes,
    ...projectCompareRoutes, ...locationGuideRoutes,
  ].map((r) => ({
    url: r.url.replace(`${BASE}/`, `${BASE}/ar/`),
    lastModified: r.lastModified,
    changeFrequency: r.changeFrequency,
    priority: 0.5,
  }));

  GROUPS = [
    // 0 core: static EN + AR static (with hreflang)
    [...staticRoutes, ...arStaticRoutes],
    // 1 projects (EN, with video entries)
    projectRoutes,
    // 2 communities + developers (EN)
    [...areaRoutes, ...developerRoutes],
    // 3 comparisons (EN)
    [...compareRoutes, ...projectCompareRoutes, ...developerCompareRoutes],
    // 4 content: locations, guides, news, collections, faq (EN)
    [...locationGuideRoutes, ...guideRoutes, ...newsRoutes, ...collectionRoutes, ...faqRoutes],
    // 5 Arabic detail mirror
    arDetailRoutes,
  ];
  return GROUPS;
}

