// Verify every YouTube videoUrl via oEmbed (free, no API key): keep it only if
// the real video title/author relates to the project. The Firecrawl LLM
// hallucinated arbitrary video IDs (incl. the Rickroll dQw4w9WgXcQ) that a
// token check can't catch because IDs aren't words — but the video's TITLE is.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ENRICH = join(root, "data", "project-enrichments.json");
const CATALOG = join(root, "data", "catalog.json");

const FAMOUS = /dQw4w9WgXcQ|oHg5SJYRHA0|9bZkp7q19f0|kJQP7kiw5Fk|YbJOTdZBX1g|jNQXAC9IVRw/i;
const STOP = new Set([
  "the", "and", "residence", "residences", "tower", "towers", "villa", "villas",
  "apartment", "apartments", "dubai", "abu", "dhabi", "sharjah", "uae", "ajman",
  "by", "at", "phase", "off", "plan", "offplan", "project", "properties",
  "property", "real", "estate", "new", "luxury", "official", "video", "walkthrough",
  "tour", "development", "developments", "group", "holding", "llc", "for", "sale",
]);

const tokens = (s) =>
  (s || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && !STOP.has(t));

const ytId = (url) => {
  const m = url.match(/[?&]v=([\w-]+)|youtu\.be\/([\w-]+)|embed\/([\w-]+)/);
  return m && (m[1] || m[2] || m[3]);
};

async function oembed(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: ctrl.signal },
    );
    if (!r.ok) return { ok: false, reason: `oembed-${r.status}` };
    const j = await r.json();
    return { ok: true, title: j.title || "", author: j.author_name || "" };
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : "fetch-error" };
  } finally {
    clearTimeout(t);
  }
}

const enrichStore = JSON.parse(readFileSync(ENRICH, "utf8"));
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const bySlug = new Map(catalog.projects.map((p) => [p.slug, p]));

const jobs = [];
for (const [slug, e] of Object.entries(enrichStore.projects)) {
  if (e.videoUrl && /youtube|youtu\.be/.test(e.videoUrl)) jobs.push({ slug, url: e.videoUrl });
}

let removed = 0, kept = 0;
const removals = [];

// small concurrency
const CONC = 6;
for (let i = 0; i < jobs.length; i += CONC) {
  const batch = jobs.slice(i, i + CONC);
  const results = await Promise.all(
    batch.map(async ({ slug, url }) => {
      const p = bySlug.get(slug);
      const projTokens = tokens(`${slug} ${p?.name ?? ""} ${p?.developer ?? ""} ${p?.area ?? ""}`);
      if (FAMOUS.test(url)) return { slug, url, keep: false, why: "famous-placeholder-id" };
      const meta = await oembed(url);
      if (!meta.ok) return { slug, url, keep: false, why: meta.reason };
      const hay = `${meta.title} ${meta.author}`.toLowerCase();
      const match = projTokens.find((t) => hay.includes(t));
      return { slug, url, keep: Boolean(match), why: match ? `match:${match}` : `no-match:"${meta.title.slice(0, 40)}"` };
    }),
  );
  for (const r of results) {
    if (r.keep) { kept++; continue; }
    removed++;
    removals.push(`${r.slug} — ${r.why}`);
    delete enrichStore.projects[r.slug].videoUrl;
    const cp = bySlug.get(r.slug);
    if (cp && /youtube|youtu\.be/.test(cp.videoUrl || "")) delete cp.videoUrl;
  }
}

// recompute videoAvailable from what survives
for (const p of catalog.projects) {
  const e = enrichStore.projects[p.slug];
  p.videoAvailable = Boolean(p.videoUrl || e?.videoUrl || e?.virtualTourUrl);
}

writeFileSync(ENRICH, `${JSON.stringify(enrichStore, null, 2)}\n`, "utf8");
writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(`[yt-scrub] checked ${jobs.length} youtube videos — kept ${kept}, removed ${removed}`);
console.log(`videoAvailable now: ${catalog.projects.filter((p) => p.videoAvailable).length}`);
console.log("removed:");
removals.forEach((r) => console.log("  -", r));
