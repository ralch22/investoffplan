// Child sitemaps at /sitemap/<id>.xml, hand-serialized. We can't use Next's
// app/sitemap.ts metadata route: with generateSitemaps() it claims the root
// /sitemap.xml path (conflicting with our index route) yet 404s it at runtime,
// leaving robots.txt/GSC pointing at a 404. Route handlers give us the same
// URLs with full control. Groups come from src/lib/sitemap-groups.ts.
import { buildGroups } from "@/lib/sitemap-groups";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const groups = await buildGroups();
  return groups.map((_, id) => ({ id: `${id}.xml` }));
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toIso(d: unknown): string | null {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string" && d) return d;
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const idx = Number.parseInt(id, 10); // "1.xml" → 1
  const groups = await buildGroups();
  const entries = Number.isInteger(idx) ? (groups[idx] ?? []) : [];
  if (entries.length === 0) return new Response("Not found", { status: 404 });

  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const e of entries) {
    parts.push("<url>");
    parts.push(`<loc>${esc(e.url)}</loc>`);
    const lastmod = toIso(e.lastModified);
    if (lastmod) parts.push(`<lastmod>${lastmod}</lastmod>`);
    if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    if (typeof e.priority === "number") parts.push(`<priority>${e.priority}</priority>`);
    const languages = e.alternates?.languages;
    if (languages) {
      for (const [lang, href] of Object.entries(languages)) {
        parts.push(
          `<xhtml:link rel="alternate" hreflang="${esc(lang)}" href="${esc(String(href))}"/>`,
        );
      }
    }
    if (Array.isArray(e.videos)) {
      for (const v of e.videos) {
        parts.push("<video:video>");
        parts.push(`<video:thumbnail_loc>${esc(v.thumbnail_loc)}</video:thumbnail_loc>`);
        parts.push(`<video:title>${esc(v.title)}</video:title>`);
        parts.push(`<video:description>${esc(v.description)}</video:description>`);
        if (v.content_loc) parts.push(`<video:content_loc>${esc(v.content_loc)}</video:content_loc>`);
        if (v.player_loc) parts.push(`<video:player_loc>${esc(String(v.player_loc))}</video:player_loc>`);
        parts.push("</video:video>");
      }
    }
    parts.push("</url>");
  }
  parts.push("</urlset>");
  return new Response(parts.join("\n"), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
