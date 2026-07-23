import type { MetadataRoute } from "next";

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