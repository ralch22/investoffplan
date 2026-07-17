/**
 * Enumerates every external asset the site would hotlink, and the stable R2 key
 * each one mirrors to. Pure functions, no I/O — so the CI guard and the mirror
 * script agree on exactly one definition of "external asset".
 *
 * WHY THIS EXISTS: measured 2026-07-17, the catalog hotlinked 17,927 assets
 * (7,137 gallery, 6,084 floor plans, 1,506 master plans, 1,221 developer logos,
 * 1,070 heroes, 909 brochures) against 5,012 we host — floor plans and master
 * plans had ZERO mirrors. PropertyFinder served ~all of it and probed healthy,
 * but it is the party whose listings we scrape: one hotlink rule and the site's
 * imagery is gone, with no fallback. Mirroring also stops us serving pages off
 * their bandwidth.
 *
 * WHY KEYS ARE CONTENT-ADDRESSED: scrape-pf-catalog rebuilds imageUrl/
 * imageGallery from PF every week and mergeProject takes fresh defined values,
 * so a /cdn URL written once is overwritten by a PF hotlink on the next run —
 * mirroring MUST re-run each ingest. Hashing the SOURCE URL means a re-scraped
 * image maps to the key it already has: the exists-check hits, nothing
 * re-downloads, and the weekly cost is only genuinely new assets. Index-based
 * keys (projects/<slug>/gallery/000.webp) cannot do this — a gallery reorder
 * silently re-uploads everything under shifted names.
 */
import { createHash } from "node:crypto";
import { extensionFromUrl } from "./keys";

export type AssetKind =
  | "hero"
  | "gallery"
  | "floorplan"
  | "masterplan"
  | "brochure"
  | "logo"
  | "enrichment";

export interface MirrorTarget {
  kind: AssetKind;
  sourceUrl: string;
  key: string;
}

/** An asset URL we do not host: anything absolute. /cdn, /images, /brand are ours. */
export function isExternalAsset(url: unknown): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function hash12(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

const DEFAULT_EXT: Record<AssetKind, string> = {
  hero: ".jpg",
  gallery: ".jpg",
  floorplan: ".jpg",
  masterplan: ".jpg",
  brochure: ".pdf",
  logo: ".png",
  enrichment: ".jpg",
};

/**
 * Stable key for one source URL. Developer logos are keyed WITHOUT the project
 * slug: 1,221 project rows share ~200 distinct logo URLs, so a global namespace
 * stores each exactly once instead of once per project.
 */
export function mirrorKey(kind: AssetKind, slug: string, sourceUrl: string): string {
  const ext = extensionFromUrl(sourceUrl, DEFAULT_EXT[kind]);
  const h = hash12(sourceUrl);
  if (kind === "logo") return `developers/logos/${h}${ext}`;
  return `projects/${slug}/${kind}/${h}${ext}`;
}

interface ProjectLike {
  slug: string;
  imageUrl?: unknown;
  imageGallery?: unknown;
  floorPlans?: unknown;
  masterPlanUrl?: unknown;
  brochureUrl?: unknown;
  developerLogo?: unknown;
}

/** Every external asset on one project, with the key it mirrors to. */
export function projectMirrorTargets(project: ProjectLike): MirrorTarget[] {
  const out: MirrorTarget[] = [];
  const push = (kind: AssetKind, url: unknown) => {
    if (!isExternalAsset(url)) return;
    out.push({ kind, sourceUrl: url, key: mirrorKey(kind, project.slug, url) });
  };

  push("hero", project.imageUrl);
  push("masterplan", project.masterPlanUrl);
  push("brochure", project.brochureUrl);
  push("logo", project.developerLogo);
  if (Array.isArray(project.imageGallery)) {
    for (const url of project.imageGallery) push("gallery", url);
  }
  if (Array.isArray(project.floorPlans)) {
    for (const fp of project.floorPlans) {
      push("floorplan", (fp as { imageUrl?: unknown })?.imageUrl);
    }
  }
  return out;
}

/** Flat list of every external asset URL on a project — for the CI guard. */
export function externalAssetUrls(project: ProjectLike): string[] {
  return projectMirrorTargets(project).map((t) => t.sourceUrl);
}

/**
 * Is this failure proof the asset is GONE, or just a bad moment?
 *
 * This distinction is the difference between mirroring the catalog and deleting
 * it. The first backfill attempt treated every exception as death and discarded
 * 1,128 of 3,500 assets — all of which mirrored fine on retry: the sources were
 * healthy (PF served 200/200 under identical sustained concurrency) and R2 was
 * healthy (40/40 concurrent PUTs); the failures were transient socket errors
 * from sustained load. Only an explicit "this does not exist" is permanent.
 */
export function isPermanentAssetFailure(message: string): boolean {
  return /\bHTTP (404|410)\b/.test(message);
}
