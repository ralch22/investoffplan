#!/usr/bin/env npx tsx
/**
 * Nulls every enrichment `brochureUrl` that is not a self-hosted /cdn asset.
 *
 * WHY: the PDP now surfaces a brochure only when it is a self-hosted /cdn PDF
 * (src/lib/brochure.ts hostedBrochureUrl / isDownloadablePdfUrl). Raw
 * third-party brochureUrls — opr.ae, emaar.com, tanamiproperties.com, and the
 * like, most of them landing pages rather than PDFs — are never rendered as a
 * download: they leak a competitor link and bypass lead capture, so the UI
 * falls back to the WhatsApp brochure request. The enrichment store still held
 * ~640 of these dead hotlinks, uncovered by the hotlink guard (which only
 * checked `images`) and never mirrored. This nulls them so the data matches the
 * runtime and the extended guard in src/lib/assets/no-hotlinks.test.ts stays
 * green.
 *
 * WHY ONLY brochureUrl: `videoUrl` (YouTube/Vimeo) and `virtualTourUrl`
 * (Matterport/360°) are intentional external embeds the PDP depends on — they
 * are links to external experiences, not page assets we mirror — so they are
 * deliberately left untouched.
 *
 * Re-runnable and idempotent: any brochureUrl not starting with /cdn/ is
 * nulled; already-null / already-/cdn entries are left as-is. Run it again
 * after any enrichment scrape that could reintroduce third-party brochureUrls.
 *
 * Usage:
 *   npx tsx scripts/clean-enrichment-brochures.ts --dry-run   # report, no write
 *   npx tsx scripts/clean-enrichment-brochures.ts             # null + rewrite
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENRICH = join(process.cwd(), "data", "project-enrichments.json");

interface Enrichment {
  brochureUrl?: string | null;
  [key: string]: unknown;
}
interface Store {
  projects: Record<string, Enrichment>;
}

/** A brochure we keep: a self-hosted /cdn asset. Everything else is a hotlink. */
function isHostedBrochure(url: unknown): boolean {
  return typeof url === "string" && url.startsWith("/cdn/");
}

function main(): void {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const store = JSON.parse(readFileSync(ENRICH, "utf8")) as Store;

  const hosts: Record<string, number> = {};
  let nulled = 0;
  for (const entry of Object.values(store.projects)) {
    const url = entry.brochureUrl;
    if (url == null || isHostedBrochure(url)) continue;
    try {
      hosts[new URL(url).host] = (hosts[new URL(url).host] ?? 0) + 1;
    } catch {
      hosts["(unparseable)"] = (hosts["(unparseable)"] ?? 0) + 1;
    }
    if (!dryRun) entry.brochureUrl = null;
    nulled++;
  }

  const top = Object.entries(hosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([h, n]) => `${h}:${n}`)
    .join(", ");
  const verb = dryRun ? "would null" : "nulled";
  console.log(`${verb} ${nulled} non-/cdn brochureUrl(s). Top hosts: ${top || "(none)"}`);

  if (!dryRun && nulled > 0) {
    writeFileSync(ENRICH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    console.log(`Wrote ${ENRICH}`);
  }
}

main();
