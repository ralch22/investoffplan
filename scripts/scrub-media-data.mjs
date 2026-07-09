// Media-poison scrub v2 (post-audit). The Firecrawl extractor hallucinated
// placeholder URLs (example.com images/brochures, YOUR_VIDEO_ID) and the old
// pickVideoUrl source-fallback grabbed unrelated pages (news clips, other
// projects' videos — 17 URLs duplicated across different projects). This
// scrubs data/project-enrichments.json AND data/catalog.json:
//   - junk URLs (example.*, placeholder/your_*_id patterns) out of
//     images[], brochureUrl, videoUrl, virtualTourUrl, imageUrl
//   - news-host video URLs out
//   - non-embed video URLs with ZERO token overlap with the project out
//   - video URLs shared by >1 project out of ALL of them (ambiguous scrape)
//   - videoAvailable recomputed from what survives
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ENRICH = join(root, "data", "project-enrichments.json");
const CATALOG = join(root, "data", "catalog.json");

const JUNK_HOSTS = new Set(["example.com", "example.org", "example.net", "test.com", "domain.com", "yourdomain.com", "localhost"]);
const JUNK_RE =
  /placeholder|lorem|your[_-]?(?:video|image|tour|link|url|file|id)|video[_-]?id\b|_here\b|link[_-]?here|insert[_-]|xxx+/i;
const NEWS_RE = /zawya|reuters|bloomberg|khaleejtimes|gulfnews|thenational|arabianbusiness|prnewswire/i;
const EMBED_RE = /youtube\.com|youtu\.be|vimeo\.com|matterport\.com|kuula\.co/i;
const STOP = new Set(["the", "and", "residence", "residences", "tower", "towers", "villas", "apartments", "dubai", "abu", "dhabi", "sharjah", "uae", "by", "at", "phase"]);

function isJunk(u) {
  if (typeof u !== "string" || !u) return true;
  if (JUNK_RE.test(u)) return true;
  // Site-relative paths (R2-migrated /cdn/... images, local brochures) are valid.
  if (u.startsWith("/") && !u.startsWith("//")) return false;
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return true;
    const h = url.hostname.toLowerCase().replace(/^www\./, "");
    return JUNK_HOSTS.has(h) || h.endsWith(".example.com") || !h.includes(".");
  } catch {
    return true;
  }
}

const tokens = (s) =>
  (s || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && !STOP.has(t));
const mentions = (u, toks) => toks.some((t) => u.toLowerCase().includes(t));

const enrichStore = JSON.parse(readFileSync(ENRICH, "utf8"));
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const bySlug = new Map(catalog.projects.map((p) => [p.slug, p]));

// Pass 1: count video URLs across projects (enrichment + catalog) for the dupe rule.
const videoUse = new Map();
for (const [slug, e] of Object.entries(enrichStore.projects)) {
  if (e.videoUrl) videoUse.set(e.videoUrl, (videoUse.get(e.videoUrl) ?? new Set()).add(slug));
}
for (const p of catalog.projects) {
  if (p.videoUrl) videoUse.set(p.videoUrl, (videoUse.get(p.videoUrl) ?? new Set()).add(p.slug));
}

function videoOk(u, slug) {
  if (isJunk(u) || NEWS_RE.test(u)) return false;
  if ((videoUse.get(u)?.size ?? 0) > 1) return false; // shared across projects = ambiguous
  if (EMBED_RE.test(u)) return true; // embeds: IDs aren't token-checkable
  const p = bySlug.get(slug);
  return mentions(u, tokens(`${slug} ${p?.name ?? ""} ${p?.developer ?? ""}`));
}

const n = { img: 0, broch: 0, vid: 0, tour: 0, catImg: 0, catVid: 0, catBroch: 0 };

for (const [slug, e] of Object.entries(enrichStore.projects)) {
  if (Array.isArray(e.images)) {
    const clean = e.images.filter((u) => !isJunk(u));
    n.img += e.images.length - clean.length;
    if (clean.length) e.images = clean;
    else delete e.images;
  }
  if (e.brochureUrl && isJunk(e.brochureUrl)) { delete e.brochureUrl; n.broch++; }
  if (e.videoUrl && !videoOk(e.videoUrl, slug)) { delete e.videoUrl; n.vid++; }
  if (e.virtualTourUrl && (isJunk(e.virtualTourUrl) || NEWS_RE.test(e.virtualTourUrl))) { delete e.virtualTourUrl; n.tour++; }
}

for (const p of catalog.projects) {
  if (p.imageUrl && isJunk(p.imageUrl)) {
    // Repair from surviving enrichment gallery, else clear.
    const e = enrichStore.projects[p.slug];
    p.imageUrl = e?.images?.[0] ?? "";
    if (!p.imageUrl) delete p.imageUrl;
    n.catImg++;
  }
  if (p.videoUrl && !videoOk(p.videoUrl, p.slug)) { delete p.videoUrl; n.catVid++; }
  if (p.brochureUrl && isJunk(p.brochureUrl)) { delete p.brochureUrl; n.catBroch++; }
  const e = enrichStore.projects[p.slug];
  p.videoAvailable = Boolean(p.videoUrl || e?.videoUrl || e?.virtualTourUrl);
}

writeFileSync(ENRICH, `${JSON.stringify(enrichStore, null, 2)}\n`, "utf8");
writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

const vids = Object.values(enrichStore.projects).filter((e) => e.videoUrl).length;
const tours = Object.values(enrichStore.projects).filter((e) => e.virtualTourUrl).length;
console.log(
  `[scrub] enrich: -${n.img} images, -${n.broch} brochures, -${n.vid} videos, -${n.tour} tours | ` +
    `catalog: -${n.catImg} imageUrl, -${n.catVid} videoUrl, -${n.catBroch} brochureUrl | ` +
    `remaining: ${vids} videos, ${tours} tours, videoAvailable=${catalog.projects.filter((p) => p.videoAvailable).length}`,
);
