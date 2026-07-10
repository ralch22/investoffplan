// Recover real, embeddable videos from developer "video" landing pages and drop
// the rest. The old pickVideoUrl captured any /video landing page — but those
// can't be iframed and aren't real videos. This Firecrawl-renders each
// non-embeddable videoUrl, extracts a genuinely embeddable source
// (YouTube / Vimeo / self-hosted .mp4 / og:video), and rewrites the enrichment
// videoUrl to that — or deletes it when the page has no real video.
//
//   FIRECRAWL_API_KEY=... node scripts/extract-video-embeds.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.FIRECRAWL_API_KEY;
if (!KEY) { console.error("No FIRECRAWL_API_KEY"); process.exit(1); }

const P = join(process.cwd(), "data", "project-enrichments.json");
const EMBEDDABLE = /youtube\.com|youtu\.be|vimeo\.com|matterport\.com/i;

function findEmbed(html) {
  if (!html) return null;
  // Priority: YouTube > Vimeo > self-hosted mp4 > og:video
  const yt = html.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{6,})/i);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const vm = html.match(/player\.vimeo\.com\/video\/([0-9]+)/i);
  if (vm) return `https://vimeo.com/${vm[1]}`;
  const og = html.match(/property=["']og:video(?::url)?["'][^>]*content=["']([^"']+)["']/i);
  if (og && /\.mp4|youtube|vimeo/i.test(og[1])) return og[1];
  const mp4 = html.match(/https?:\/\/[A-Za-z0-9_\/:.%-]+\.mp4/i);
  if (mp4) return mp4[0];
  return null;
}

async function scrape(url) {
  try {
    const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["html"], waitFor: 4500, timeout: 45000 }),
    });
    const j = await r.json();
    return j.data?.html || "";
  } catch {
    return "";
  }
}

const data = JSON.parse(readFileSync(P, "utf8"));
const entries = Object.values(data.projects).filter(
  (e) => e.videoUrl && !EMBEDDABLE.test(e.videoUrl),
);
console.log(`[video-embed] ${entries.length} non-embeddable videoUrls to resolve`);

let recovered = 0, dropped = 0, i = 0;
for (const e of entries) {
  i++;
  const html = await scrape(e.videoUrl);
  const embed = findEmbed(html);
  if (embed) {
    process.stdout.write(`  • ${e.slug}: recovered ${embed.slice(0, 60)}\n`);
    e.videoUrl = embed;
    recovered++;
  } else {
    delete e.videoUrl;
    dropped++;
  }
  if (i % 5 === 0 || i === entries.length) {
    writeFileSync(P, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`[video-embed] ${i}/${entries.length} — recovered=${recovered} dropped=${dropped}`);
  }
}
writeFileSync(P, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`[video-embed] Done. recovered=${recovered} dropped=${dropped}`);
