import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dailyCounters } from "@/lib/db/schema";

/**
 * Site-wide daily advisor budget — the HARD spend ceiling on Workers AI.
 * Per-IP rate limits shape traffic; only this counter bounds total neuron
 * spend (a distributed botnet under the per-IP cap is otherwise unbounded).
 *
 * D1 is single-primary, so the UPSERT increment is globally correct — exactly
 * what per-colo rate limiters cannot give. One D1 write per advisor call is
 * negligible at advisor volumes.
 */
const DEFAULT_DAILY_CAP = 300;

export async function consumeAdvisorBudget(): Promise<boolean> {
  const cap = Number(process.env.ADVISOR_DAILY_CAP ?? DEFAULT_DAILY_CAP);
  if (!Number.isFinite(cap) || cap <= 0) return true; // 0/invalid = disabled
  const db = await getDb();
  if (!db) return true; // local e2e / missing binding — guard must never be the outage
  try {
    const key = `advisor:${new Date().toISOString().slice(0, 10)}`;
    const now = new Date().toISOString();
    const row = await db
      .insert(dailyCounters)
      .values({ key, count: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: dailyCounters.key,
        set: { count: sql`${dailyCounters.count} + 1`, updatedAt: now },
      })
      .returning({ count: dailyCounters.count })
      .get();
    const exhausted = (row?.count ?? 0) > cap;
    if (exhausted) {
      console.log(
        JSON.stringify({ advisor_budget_exhausted: { count: row?.count, cap } }),
      );
    }
    return !exhausted;
  } catch (error) {
    console.error("[advisor] budget counter failed — allowing request", error);
    return true;
  }
}
