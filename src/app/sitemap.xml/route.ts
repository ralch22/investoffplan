// Root sitemap INDEX. Next's generateSitemaps() (src/app/sitemap.ts) emits only
// the child sitemaps at /sitemap/[id].xml — it does NOT create the root
// /sitemap.xml index, so robots.txt and the GSC submission would 404 without
// this route. Child count must match the GROUPS array in src/app/sitemap.ts.
export const dynamic = "force-static";

const CHILD_COUNT = 6;

let base: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://investoffplan.com";
if (!base || base.includes("preview") || base.includes("emerge-digital")) {
  base = "https://investoffplan.com";
}

export function GET(): Response {
  const now = new Date().toISOString();
  const children = Array.from({ length: CHILD_COUNT }, (_, id) =>
    [
      "  <sitemap>",
      `    <loc>${base}/sitemap/${id}.xml</loc>`,
      `    <lastmod>${now}</lastmod>`,
      "  </sitemap>",
    ].join("\n"),
  ).join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    children,
    "</sitemapindex>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
