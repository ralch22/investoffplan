import type { MetadataRoute } from "next";
import { getDevelopers, getCatalogApi } from "@/lib/catalog";
import { videoSitemapEntry } from "@/lib/media";
import { getCommunities } from "@/lib/communities";
import { getRecentSales } from "@/lib/dld-recent-sales";
import { getComparablePairSlugs } from "@/lib/area-compare";
import { getComparableProjectSlugs } from "@/lib/project-compare";
import { getComparableDeveloperSlugs } from "@/lib/developer-compare";
import { LOCATION_GUIDES } from "@/lib/location-guides";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { getNewsArticles } from "@/content/articles";
import { FAQ_TOPICS } from "@/content/faq";
import { COLLECTION_PAGES } from "@/lib/collections";
import { getSiteUrl } from "@/lib/site-url";
import { MARKET_REPORT_EDITIONS } from "@/lib/market-report-editions";

// Apex default via getSiteUrl(); the preview scrub stays so an env var that is
// EXPLICITLY set to the preview Worker never leaks into sitemap URLs either.
let base: string = getSiteUrl();
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
    "", "/projects", "/developers", "/communities", "/market-report", "/market-report/archive", "/compare",
    "/sold-prices",
    "/invest-from-india", "/invest-from-uk",
    "/compare-projects", "/compare-developers",
    "/locations", "/guides", "/faq", "/map", "/contact", "/about", "/news",
    "/feature-your-project",
    // /favorites is user-state (noindex) — omit from sitemap.
    "/tools", "/tools/price-map", "/tools/communities",
    "/tools/rent-vs-buy", "/tools/mortgage", "/tools/residential", "/tools/payment",
    "/tools/roi", "/tools/investor-match",
    "/privacy-policy", "/cookie-policy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/market-report" ? 0.9 : 0.8,
    ...(path === "/market-report"
      ? {
          alternates: {
            languages: {
              en: `${BASE}/market-report`,
              ar: `${BASE}/ar/market-report`,
            },
          },
        }
      : {}),
  }));

  const projectRoutes: Entry[] = api.projects.map((p) => {
    const enUrl = `${BASE}/projects/${p.slug}`;
    const arUrl = `${BASE}/ar/projects/${p.slug}`;
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
      url: enUrl,
      lastModified: catalogUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: arUrl } },
      ...(video ? { videos: [video] } : {}),
    };
  });

  const developers = await getDevelopers();
  const developerRoutes: Entry[] = developers.map((d) => {
    const enUrl = `${BASE}/developers/${d.slug}`;
    return {
      url: enUrl,
      lastModified: catalogUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: `${BASE}/ar/developers/${d.slug}` } },
    };
  });

  const communities = await getCommunities();
  const areaRoutes: Entry[] = communities.map((c) => {
    const enUrl = `${BASE}/communities/${c.slug}`;
    return {
      url: enUrl,
      lastModified: catalogUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: `${BASE}/ar/communities/${c.slug}` } },
    };
  });

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

  const guideRoutes: Entry[] = GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => {
    const enUrl = `${BASE}${g.href}`;
    return {
      url: enUrl,
      lastModified: catalogUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: `${BASE}/ar${g.href}` } },
    };
  });

  const newsRoutes: Entry[] = getNewsArticles().map((article) => {
    const enUrl = `${BASE}/news/${article.slug}`;
    return {
      url: enUrl,
      lastModified: new Date(`${article.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: `${BASE}/ar/news/${article.slug}` } },
    };
  });

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
    "/ar/market-report", "/ar/market-report/archive",
    "/ar/developers", "/ar/guides", "/ar/news", "/ar/faq", "/ar/compare",
    "/ar/compare-projects", "/ar/compare-developers",
    "/ar/locations", "/ar/map",
    "/ar/tools", "/ar/tools/mortgage", "/ar/tools/payment", "/ar/tools/rent-vs-buy",
    "/ar/tools/communities", "/ar/tools/price-map", "/ar/tools/residential",
    "/ar/tools/roi", "/ar/tools/investor-match",
  ];
  const arStaticRoutes: Entry[] = arStaticPaths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: catalogUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        "x-default": path === "/ar" ? `${BASE}/` : `${BASE}${path.slice(3)}`,
        en: path === "/ar" ? `${BASE}/` : `${BASE}${path.slice(3)}`,
        ar: `${BASE}${path}`,
      },
    },
  }));
  // AR detail mirrors — derived from EN detail arrays with reciprocal hreflang.
  // Videos dropped: EN video sitemap is canonical for video discovery.
  const arDetailRoutes: Entry[] = [
    ...projectRoutes, ...areaRoutes, ...developerRoutes, ...guideRoutes,
    ...newsRoutes, ...collectionRoutes, ...faqRoutes, ...compareRoutes,
    ...projectCompareRoutes, ...developerCompareRoutes, ...locationGuideRoutes,
  ].map((r) => {
    const enUrl = r.url;
    const arUrl = enUrl.replace(`${BASE}/`, `${BASE}/ar/`);
    return {
      url: arUrl,
      lastModified: r.lastModified,
      changeFrequency: r.changeFrequency,
      priority: 0.5,
      alternates: { languages: { "x-default": enUrl, en: enUrl, ar: arUrl } },
    };
  });

  // 6 sold prices (EN only in v1 — AR added once EN indexing proves healthy).
  // Sample-gated: only communities clearing the 8-transaction floor are listed,
  // matching the per-page noindex rule (thin-page protection).
  const soldPricesCommunities = await getCommunities();
  const soldPricesRoutes: Entry[] = soldPricesCommunities
    .filter((c) => (getRecentSales(c.name)?.length ?? 0) >= 8)
    .map((c) => ({
      url: `${BASE}/sold-prices/${c.slug}`,
      lastModified: catalogUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          en: `${BASE}/sold-prices/${c.slug}`,
          ar: `${BASE}/ar/sold-prices/${c.slug}`,
        },
      },
    }));

  // 7 market report editions (quarterly; EN + AR hreflang).
  const editionRoutes: Entry[] = MARKET_REPORT_EDITIONS.map((e) => ({
    url: `${BASE}/market-report/${e.slug}`,
    lastModified: new Date(`${e.publishedAt}T00:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
    alternates: {
      languages: {
        "x-default": `${BASE}/market-report/${e.slug}`,
        en: `${BASE}/market-report/${e.slug}`,
        ar: `${BASE}/ar/market-report/${e.slug}`,
      },
    },
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
    // 6 sold prices (EN, sample-gated)
    soldPricesRoutes,
    // 7 market report editions (EN + AR hreflang)
    editionRoutes,
  ];
  return GROUPS;
}

/** Number of child sitemap groups. Consumed by the sitemap index route so it
 * never goes out of sync with the GROUPS array above. */
export const SITEMAP_GROUP_COUNT = 8;

