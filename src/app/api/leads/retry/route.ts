import { NextResponse } from "next/server";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { forwardLeadToGhl, isGhlConfigured } from "@/lib/ghl";

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

  const rows = await db
    .select()
    .from(leads)
    .where(
      and(
        inArray(leads.ghlStatus, ["pending", "failed", "skipped"]),
        lt(leads.ghlAttempts, MAX_ATTEMPTS),
      ),
    )
    .orderBy(leads.createdAt)
    .limit(BATCH);

  let sent = 0;
  for (const row of rows) {
    const result = await forwardLeadToGhl({
      formType: row.formType,
      name: row.name ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      message: row.message ?? undefined,
      projectSlug: row.projectSlug ?? undefined,
      pagePath: row.pagePath ?? undefined,
    });
    if (result.status === "sent") sent += 1;
    await db
      .update(leads)
      .set({
        ghlStatus: result.status,
        ghlAttempts: sql`${leads.ghlAttempts} + 1`,
        ghlContactId: result.status === "sent" ? (result.contactId ?? null) : row.ghlContactId,
        ghlLastError: result.status === "failed" ? result.error : null,
      })
      .where(eq(leads.id, row.id));
  }

  return NextResponse.json({ ok: true, scanned: rows.length, sent });
}
