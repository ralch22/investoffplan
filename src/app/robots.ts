import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const envSite = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isPreview =
    envSite.includes("preview") || envSite.includes("emerge-digital.workers.dev");

  return {
    rules: isPreview
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: "https://investoffplan.com/sitemap.xml",
  };
}