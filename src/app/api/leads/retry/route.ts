import { NextResponse } from "next/server";
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { forwardLeadToGhl, isGhlConfigured } from "@/lib/ghl";
import { getPlacementLeadBoost } from "@/lib/placements";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const BATCH = 25;

/**
 * Re-forwards stored leads whose GHL delivery is pending/failed/skipped.
 * Guarded by LEADS_RETRY_TOKEN; triggered by the leads-retry GitHub Actions
 * cron (and usable manually once GHL secrets are first configured, to flush
 * the backlog captured while forwarding was skipped).
 */
export async function POST(request: Request) {
  const secret = process.env.LEADS_RETRY_TOKEN;
  const provided = request.headers.get("x-retry-token") ?? "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!isGhlConfigured()) {
    return NextResponse.json({ ok: true, retried: 0, note: "GHL not configured" });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }

  // Retry pending/failed/skipped deliveries — and backfill pipeline
  // opportunities for leads that reached GHL as contacts before opportunity
  // staging existed (or whose opportunity call failed).
  const rows = await db
    .select()
    .from(leads)
    .where(
      and(
        or(
          inArray(leads.ghlStatus, ["pending", "failed", "skipped"]),
          and(eq(leads.ghlStatus, "sent"), isNull(leads.ghlOpportunityId)),
        ),
        lt(leads.ghlAttempts, MAX_ATTEMPTS),
      ),
    )
    .orderBy(leads.createdAt)
    .limit(BATCH);

  let sent = 0;
  for (const row of rows) {
    // Re-derive paid-placement tagging identically to the live pipeline
    // (/api/leads) so a retried lead reaches GHL with the same tags/prefix.
    const boost = await getPlacementLeadBoost(row.projectSlug);
    const result = await forwardLeadToGhl({
      formType: row.formType,
      name: row.name ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      message: row.message ?? undefined,
      projectSlug: row.projectSlug ?? undefined,
      pagePath: row.pagePath ?? undefined,
      extraTags: boost?.extraTags,
      opportunityNamePrefix: boost?.opportunityNamePrefix,
    });
    if (result.status === "sent") sent += 1;
    await db
      .update(leads)
      .set({
        ghlStatus: result.status,
        ghlAttempts: sql`${leads.ghlAttempts} + 1`,
        ghlContactId: result.status === "sent" ? (result.contactId ?? null) : row.ghlContactId,
        ghlOpportunityId:
          result.status === "sent"
            ? (result.opportunityId ?? row.ghlOpportunityId)
            : row.ghlOpportunityId,
        ghlLastError:
          result.status === "failed"
            ? result.error
            : result.status === "sent"
              ? (result.opportunityError ?? null)
              : null,
      })
      .where(eq(leads.id, row.id));
  }

  return NextResponse.json({ ok: true, scanned: rows.length, sent });
}
