import { NextResponse } from "next/server";
import { isFirecrawlConfigured } from "@/lib/firecrawl";
import { getEnrichmentMeta } from "@/lib/enrichments";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = getEnrichmentMeta();

  return NextResponse.json({
    firecrawlConfigured: isFirecrawlConfigured(),
    enrichedProjects: meta.count,
    updatedAt: meta.updatedAt,
    pipeline: "phase-2",
  });
}