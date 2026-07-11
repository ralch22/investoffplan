import { NextResponse } from "next/server";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { isFirecrawlConfigured } from "@/lib/firecrawl";
import { getEnrichmentMeta } from "@/lib/enrichments";
import { isTurnstileEnabled } from "@/lib/turnstile";
import { isEmailConfigured } from "@/lib/email/resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { fetchCatalogMeta, isCatalogDbSeeded, verifyCatalogSeed } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const analytics = await getCatalogAnalytics();
  const enrichment = getEnrichmentMeta();
  const db = await getDb();
  const dbSeeded = db ? await isCatalogDbSeeded(db) : false;
  const dbMeta = db && dbSeeded ? await fetchCatalogMeta(db) : null;
  const seedVerification = db
    ? await verifyCatalogSeed(db, {
        projects: analytics.projectCount,
        units: analytics.unitCount,
      })
    : null;

  let assetsBucketAvailable = false;
  try {
    const { env } = await getCloudflareContext({ async: true });
    assetsBucketAvailable = Boolean(env.ASSETS_R2_BUCKET);
  } catch {
    assetsBucketAvailable = false;
  }

  // Overall status is degraded when D1 is bound but its seed fails verification
  // (partial seed, stale seed, or empty tables) — surfaces prod seed drift.
  const status = seedVerification && !seedVerification.ok ? "degraded" : "ok";

  return NextResponse.json({
    status,
    catalog: {
      units: analytics.unitCount,
      projects: analytics.projectCount,
      developers: analytics.developerCount,
      brochures: analytics.brochureCount,
      brochurePct: analytics.brochurePct,
      brochureGap: analytics.projectCount - analytics.brochureCount,
      scrapedAt: analytics.scrapedAt,
      liteCatalogPath: "/data/catalog-lite.json",
      fullCatalogPath: "/data/catalog.json",
      database: {
        binding: "DB",
        available: Boolean(db),
        seeded: dbSeeded,
        scrapedAt: dbMeta?.scrapedAt ?? null,
        apiBase: "/api/catalog",
        seed: seedVerification,
      },
    },
    enrichment: {
      firecrawlConfigured: isFirecrawlConfigured(),
      enrichedProjects: enrichment.count,
      updatedAt: enrichment.updatedAt,
      pipeline: "phase-2",
    },
    assets: {
      binding: "ASSETS_R2_BUCKET",
      available: assetsBucketAvailable,
      cdnBase: "/cdn",
    },
    security: {
      turnstileEnabled: isTurnstileEnabled(),
    },
    email: {
      configured: isEmailConfigured(),
    },
  });
}