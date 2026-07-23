import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * The single source of truth for robots.txt.
 *
 * There used to be two: this route and a static `public/robots.txt`. A static
 * file in public/ is served verbatim and this route never ran — so the two
 * disagreed and only the static one took effect. They are now reconciled here,
 * because a static file cannot do the one thing that actually matters below:
 * keep the public preview worker out of the index.
 *
 * ⚠️ Cloudflare's *Managed robots.txt* (dashboard) prepends its own block at the
 * edge, including `Disallow: /` for several AI crawlers (GPTBot, ClaudeBot,
 * CCBot, Google-Extended, …). That OVERRIDES the AI-crawler `Allow` rules below,
 * which express our AEO/GEO intent to admit citation-class bots. To actually let
 * them in, that setting has to be changed in the Cloudflare dashboard — it is not
 * something this file can win against.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl() || "https://investoffplan.com";
  const isPreview =
    site.includes("preview") || site.includes("emerge-digital.workers.dev");

  // The preview worker is a public *.workers.dev copy of the whole site that
  // shares production data. It must never be indexed — hence a static
  // public/robots.txt (which would serve `Allow: /` here) could not be the
  // source of truth.
  if (isPreview) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${site}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/ has no canonical content; /compare/units is the share-link-driven
        // client compare tool; /*?ask= is the home ask-bar's linkable-answer
        // param — home canonicalises to the bare URL and never reads searchParams,
        // so none of these are real indexable pages, and crawling an ask link
        // would spend a slice of the advisor's daily budget.
        // ⚠️ "/compare/units" must stay exactly this specific — a bare "/compare"
        // would prefix-block the /compare hub, /compare/[pair], /compare-projects/*
        // and /compare-developers/* (~825 sitemap URLs).
        disallow: ["/api/", "/compare/units", "/*?ask="],
      },
      // Citation-class AI crawlers are welcome (AEO/GEO). See the ⚠️ above: the
      // Cloudflare Managed block currently overrides this at the edge.
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"],
        allow: "/",
      },
      // High crawl volume, no citation value.
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
