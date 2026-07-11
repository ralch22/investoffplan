import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { placements, projects } from "@/lib/db/schema";
import { isPlacementSurface, PLACEMENT_SURFACES } from "@/lib/placements";

export const dynamic = "force-dynamic";

/**
 * Admin CRUD for paid featured placements.
 *
 * Guard: `x-admin-token` header must equal env PLACEMENTS_ADMIN_TOKEN
 * (timing-safe compare, mirroring /api/leads/retry's token-guard pattern).
 * Locked-closed: when the env var is unset, EVERY request is a 401 — there is
 * no unauthenticated mode.
 *
 * See docs/placements.md for the curl workflow.
 */

/** Constant-time string compare — never early-exits on a mismatched byte. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Length leak is unavoidable with a plain compare; still burn through the
  // provided bytes so per-byte timing reveals nothing about the secret.
  let diff = ab.length === bb.length ? 0 : 1;
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i % (bb.length || 1)];
  }
  return diff === 0 && bb.length > 0;
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.PLACEMENTS_ADMIN_TOKEN;
  if (!secret) return false; // locked-closed when the env is unset
  const provided = request.headers.get("x-admin-token") ?? "";
  return timingSafeEqual(provided, secret);
}

interface PlacementUpsertBody {
  id?: string;
  projectSlug?: string;
  surface?: string;
  rank?: number;
  startsAt?: string;
  featuredUntil?: string;
  leadPriority?: number;
  notes?: string;
}

function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }

  try {
    const rows = await db
      .select()
      .from(placements)
      .orderBy(asc(placements.surface), asc(placements.rank), asc(placements.createdAt))
      .all();
    const now = new Date().toISOString();
    return NextResponse.json({
      ok: true,
      now,
      placements: rows.map((row) => ({
        ...row,
        active: row.startsAt <= now && now < row.featuredUntil,
      })),
    });
  } catch (error) {
    // Placements table missing (migration not applied yet) or query failure.
    return NextResponse.json(
      { ok: false, error: (error as Error).message.slice(0, 200) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  let body: PlacementUpsertBody;
  try {
    body = (await request.json()) as PlacementUpsertBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug.trim() : "";
  if (!projectSlug) {
    return NextResponse.json({ ok: false, error: "projectSlug is required" }, { status: 400 });
  }

  if (!isPlacementSurface(body.surface)) {
    return NextResponse.json(
      { ok: false, error: `surface must be one of: ${PLACEMENT_SURFACES.join(", ")}` },
      { status: 400 },
    );
  }

  const featuredUntil = parseIsoDate(body.featuredUntil);
  if (!featuredUntil) {
    return NextResponse.json(
      { ok: false, error: "featuredUntil must be a valid ISO date" },
      { status: 400 },
    );
  }
  if (featuredUntil <= new Date().toISOString()) {
    return NextResponse.json(
      { ok: false, error: "featuredUntil must be in the future" },
      { status: 400 },
    );
  }

  const startsAt = body.startsAt !== undefined ? parseIsoDate(body.startsAt) : new Date().toISOString();
  if (!startsAt) {
    return NextResponse.json(
      { ok: false, error: "startsAt must be a valid ISO date" },
      { status: 400 },
    );
  }
  if (startsAt >= featuredUntil) {
    return NextResponse.json(
      { ok: false, error: "startsAt must be before featuredUntil" },
      { status: 400 },
    );
  }

  const rank = Number.isFinite(body.rank) ? Math.trunc(body.rank as number) : 100;
  const leadPriority = Number.isFinite(body.leadPriority)
    ? Math.trunc(body.leadPriority as number)
    : 1;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : null;

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }

  // Validate the slug against the projects table — warn-not-block when the
  // lookup itself fails (e.g. mid-ingest), so ops are never wedged on it.
  let warning: string | undefined;
  try {
    const project = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .get();
    if (!project) {
      return NextResponse.json(
        { ok: false, error: `Unknown projectSlug "${projectSlug}" — not in the projects table` },
        { status: 400 },
      );
    }
  } catch {
    warning = "projectSlug existence check failed (projects lookup errored) — placement saved unverified";
  }

  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const record = {
    id,
    projectSlug,
    surface: body.surface,
    rank,
    startsAt,
    featuredUntil,
    leadPriority,
    notes,
    createdAt: new Date().toISOString(),
  };

  try {
    await db
      .insert(placements)
      .values(record)
      .onConflictDoUpdate({
        target: placements.id,
        set: {
          projectSlug: record.projectSlug,
          surface: record.surface,
          rank: record.rank,
          startsAt: record.startsAt,
          featuredUntil: record.featuredUntil,
          leadPriority: record.leadPriority,
          notes: record.notes,
        },
      });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, placement: record, ...(warning ? { warning } : {}) });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }

  try {
    await db.delete(placements).where(eq(placements.id, id));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, deleted: id });
}
