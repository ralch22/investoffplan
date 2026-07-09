// Completion pass: promote Firecrawl enrichment into the catalog so it survives
// the catalog → D1 → SERP round-trip.
//   - imageUrl: fill bare projects from enrichment gallery (SERP cards)
//   - videoUrl: fill from enrichment (kept in catalog; PDP already merges it)
//   - videoAvailable: set HONESTLY from real video/tour URL presence, replacing
//     the stale PF "has video" flag so the SERP "Video tour" filter stops
//     promising media the site can't show.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const CATALOG = join(root, "data", "catalog.json");
const ENRICH = join(root, "data", "project-enrichments.json");

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const enrich = JSON.parse(readFileSync(ENRICH, "utf8")).projects;

let imgFilled = 0;
let videoFilled = 0;
let vaTrue = 0;
let vaFlipsOff = 0;

for (const p of catalog.projects) {
  const e = enrich[p.slug];
  const eImage = e?.images?.[0];
  const eVideo = e?.videoUrl;
  const eTour = e?.virtualTourUrl;

  if (!p.imageUrl && eImage) {
    p.imageUrl = eImage;
    imgFilled++;
  }
  if (!p.videoUrl && eVideo) {
    p.videoUrl = eVideo;
    videoFilled++;
  }

  const hasRealMedia = Boolean(p.videoUrl || eVideo || eTour);
  if (p.videoAvailable && !hasRealMedia) vaFlipsOff++;
  p.videoAvailable = hasRealMedia;
  if (hasRealMedia) vaTrue++;
}

writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(
  `[promote] imageUrl filled: ${imgFilled} | videoUrl filled: ${videoFilled} | ` +
    `videoAvailable honest-true: ${vaTrue} (stale flags removed: ${vaFlipsOff})`,
);
