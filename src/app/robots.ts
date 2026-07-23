import type { MetadataRoute } from "next";

/**
 * ⚠️ THIS FILE IS NOT SERVED. `public/robots.txt` exists, and a static file in
 * public/ wins over a metadata route — so the live robots.txt is that one, and
 * every rule below (including the /api/ and /compare/units disallows) has no
 * effect in production. Verified against investoffplan.com/robots.txt.
 *
 * Kept rather than deleted because the two disagree and choosing between them
 * changes live crawl behaviour, which deserves its own change. If you need a
 * rule to actually apply today, edit `public/robots.txt`.
 */

export default function robots(): MetadataRoute.Robots {
  const envSite = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isPreview =
    envSite.includes("preview") || envSite.includes("emerge-digital.workers.dev");

  return {
    rules: isPreview
      ? { userAgent: "*", disallow: "/" }
      : {
          userAgent: "*",
          allow: "/",
          // Keep API routes and the client-side unit-compare tool (share-link
          // driven, no canonical content) out of the index. NOTE: this must NOT
          // be a bare "/compare" — that prefix-blocks the /compare SEO hub,
          // /compare/[pair], /compare-projects/* and /compare-developers/*
          // (~825 sitemap URLs).
          // `/*?ask=` is belt-and-braces: the home page's canonical is the bare
          // site URL and its metadata never reads searchParams, so an ask link
          // can't become a separate indexable URL anyway. This just stops
          // crawlers spending the advisor's daily budget walking shared links.
          disallow: ["/api/", "/compare/units", "/*?ask="],
        },
    sitemap: "https://investoffplan.com/sitemap.xml",
  };
}