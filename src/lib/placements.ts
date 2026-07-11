/**
 * Paid featured-placement rails (server-side).
 *
 * Placements are RUNTIME-only D1 data: the static build has no D1 context and
 * the weekly ingest clobbers `projects` rows, so paid slots live in their own
 * `placements` table and are overlaid at request time. Every read here is
 * degrade-gracefully — no placements table yet, no D1 binding, build time, or
 * any query error all resolve to "no placements" and the site behaves exactly
 * as it does today. These functions never throw.
 *
 * Ad-disclosure rule: anything surfaced through a placement must be visibly
 * labeled ("Featured") in the UI.
 */

import { and, asc, eq, gt, lte } from "drizzle-orm";
import { getDb, type CatalogDatabase } from "./db/client";
import { placements } from "./db/schema";

export const PLACEMENT_SURFACES = ["home-featured", "serp-boost"] as const;
export type PlacementSurface = (typeof PLACEMENT_SURFACES)[number];

export function isPlacementSurface(value: unknown): value is PlacementSurface {
  return (PLACEMENT_SURFACES as readonly string[]).includes(value as string);
}

export interface Placement {
  id: string;
  projectSlug: string;
  surface: PlacementSurface;
  rank: number;
  startsAt: string;
  featuredUntil: string;
  leadPriority: number;
  notes: string | null;
  createdAt: string;
}

/**
 * Active placements for a surface, ordered by rank (then creation time), using
 * an already-open DB handle. Returns [] on any error — including "table does
 * not exist yet" (migration not applied) — so callers never need a guard.
 */
export async function fetchActivePlacements(
  db: CatalogDatabase,
  surface: PlacementSurface,
): Promise<Placement[]> {
  try {
    const now = new Date().toISOString();
    const rows = await db
      .select()
      .from(placements)
      .where(
        and(
          eq(placements.surface, surface),
          lte(placements.startsAt, now),
          gt(placements.featuredUntil, now),
        ),
      )
      .orderBy(asc(placements.rank), asc(placements.createdAt))
      .all();
    return rows.map((row) => ({ ...row, surface: row.surface as PlacementSurface }));
  } catch {
    return [];
  }
}

/**
 * Active placements for a surface. Returns [] at build time (no D1 context),
 * when the DB binding is unavailable, or on any query error — never throws.
 */
export async function getActivePlacements(
  surface: PlacementSurface,
): Promise<Placement[]> {
  try {
    if (process.env.NEXT_IS_BUILD === "1") return [];
    const db = await getDb();
    if (!db) return [];
    return await fetchActivePlacements(db, surface);
  } catch {
    return [];
  }
}

/**
 * The active placement for a project slug (any surface), for lead tagging.
 * Prefers the lowest rank when a project holds slots on multiple surfaces.
 * Returns null on any error — never throws.
 */
export async function getPlacementForSlug(slug: string): Promise<Placement | null> {
  try {
    if (!slug || process.env.NEXT_IS_BUILD === "1") return null;
    const db = await getDb();
    if (!db) return null;
    const now = new Date().toISOString();
    const row = await db
      .select()
      .from(placements)
      .where(
        and(
          eq(placements.projectSlug, slug),
          lte(placements.startsAt, now),
          gt(placements.featuredUntil, now),
        ),
      )
      .orderBy(asc(placements.rank), asc(placements.createdAt))
      .get();
    if (!row) return null;
    return { ...row, surface: row.surface as PlacementSurface };
  } catch {
    return null;
  }
}

export interface PlacementLeadBoost {
  /** Extra GHL contact tags, e.g. ["premium-placement", "placement:home-featured"]. */
  extraTags: string[];
  /** Prefix for the GHL opportunity name, e.g. "[FEATURED] ". */
  opportunityNamePrefix: string;
}

/**
 * Shared lead-tagging helper used by BOTH the live lead pipeline
 * (/api/leads) and the retry cron (/api/leads/retry) so a retried lead is
 * tagged identically to a first-attempt one. A lead qualifies when its
 * project holds an active placement with lead_priority >= 1.
 * Returns null (no boost) on any error — never throws.
 */
export async function getPlacementLeadBoost(
  projectSlug: string | null | undefined,
): Promise<PlacementLeadBoost | null> {
  if (!projectSlug) return null;
  const placement = await getPlacementForSlug(projectSlug);
  if (!placement || placement.leadPriority < 1) return null;
  return {
    extraTags: ["premium-placement", `placement:${placement.surface}`],
    opportunityNamePrefix: "[FEATURED] ",
  };
}
