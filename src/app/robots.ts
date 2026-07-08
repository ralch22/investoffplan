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
          // Keep API routes and the client-side compare tool out of the index.
          // /compare is a draft utility page (share-link driven, no canonical content).
          disallow: ["/api/", "/compare"],
        },
    sitemap: "https://investoffplan.com/sitemap.xml",
  };
}