import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/server";
import { getCommunity } from "@/lib/communities";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";

// Session-guarded, request-time route (reads request headers) — the deep
// dataset (full monthly trend + per-bed breakdown) is fetched on interaction
// only, never embedded in static page HTML, so pages stay ISR and identical
// for every visitor.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getSessionFromRequest(request);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const stats = getAreaStats(community.name);
  if (!stats) {
    return NextResponse.json(
      { error: "No market data for this community" },
      { status: 404 },
    );
  }

  const { source, sourcePeriod } = getDldSource();
  return NextResponse.json(
    {
      community: { slug: community.slug, name: community.name },
      stats,
      source,
      sourcePeriod,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
