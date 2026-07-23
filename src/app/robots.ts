import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * The single source of truth for robots.txt — for site structure only.
 *
 * Deliberate scope split:
 * - AI-crawler policy is owned by **Cloudflare AI Crawl Control** (dashboard →
 *   AI Crawl Control), NOT here. It enforces at the WAF and keeps its managed
 *   robots.txt block current as new AI bots appear. Its posture: block the bulk
 *   "AI Crawler" scrapers/trainers (GPTBot, ClaudeBot, CCBot, Google-Extended,
 *   Bytespider, …) while allowing the AI *search / citation* bots (OAI-SearchBot,
 *   Claude-SearchBot, PerplexityBot, Applebot, Googlebot, Bing, …) — i.e. stay
 *   citable in AI answers without being free training data.
 *   This file must NOT re-declare those bots: a robots `Allow` here cannot beat
 *   the WAF block, and only makes the served robots.txt contradict itself and the
 *   `ai-train=no` content-signal Cloudflare sets. (Verified in the dashboard,
 *   2026-07-23.)
 * - This file owns the site-structure rules below, plus the one thing a static
 *   `public/robots.txt` could not do: lock the public preview worker out of the
 *   index.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl() || "https://investoffplan.com";
  const isPreview =
    site.includes("preview") || site.includes("emerge-digital.workers.dev");

  // The preview worker is a public *.workers.dev copy of the whole site that
  // shares production data. It must never be indexed — which a static
  // public/robots.txt (served `Allow: /` everywhere) could not guarantee.
  if (isPreview) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${site}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/ has no canonical content; /compare/units is the share-link-driven
      // client compare tool; /*?ask= is the home ask-bar's linkable-answer param
      // (home canonicalises to the bare URL and never reads searchParams, so none
      // are real indexable pages, and crawling an ask link would spend a slice of
      // the advisor's daily budget).
      // ⚠️ "/compare/units" must stay exactly this specific — a bare "/compare"
      // would prefix-block the /compare hub, /compare/[pair], /compare-projects/*
      // and /compare-developers/* (~825 sitemap URLs).
      disallow: ["/api/", "/compare/units", "/*?ask="],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
