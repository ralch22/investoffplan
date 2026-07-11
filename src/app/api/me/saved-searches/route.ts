import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { savedSearches } from "@/lib/db/schema";
import { sanitizeSavedSearchFilters } from "@/lib/alerts/match";

export const dynamic = "force-dynamic";

const MAX_SEARCHES_PER_USER = 20;
const MAX_LABEL_LENGTH = 80;

/** Two UUIDs stripped to hex — 64 chars of URL-safe entropy. */
function newUnsubscribeToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

async function requireUser(request: Request) {
  const session = await getSessionFromRequest(request);
  const userId = session?.user?.id;
  if (!userId) return null;
  return { userId };
}

function serializeRow(row: typeof savedSearches.$inferSelect) {
  let filters: unknown = {};
  try {
    filters = JSON.parse(row.filters);
  } catch {
    // Corrupt row — return empty filters rather than failing the list.
  }
  return {
    id: row.id,
    label: row.label,
    filters,
    locale: row.locale,
    alertEnabled: row.alertEnabled === 1,
    alertFrequency: row.alertFrequency,
    lastAlertAt: row.lastAlertAt,
    createdAt: row.createdAt,
  };
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const db = await getDb();
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });

  const rows = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, auth.userId))
    .orderBy(savedSearches.createdAt);

  return NextResponse.json({ ok: true, searches: rows.map(serializeRow) });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const db = await getDb();
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });

  let body: { label?: unknown; filters?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const label =
    typeof body.label === "string" ? body.label.trim().slice(0, MAX_LABEL_LENGTH) : "";
  if (!label) {
    return NextResponse.json({ ok: false, error: "Label required" }, { status: 400 });
  }
  const filters = sanitizeSavedSearchFilters(body.filters);
  const locale = body.locale === "ar" ? "ar" : "en";

  const countRow = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(savedSearches)
    .where(eq(savedSearches.userId, auth.userId))
    .get();
  if ((countRow?.count ?? 0) >= MAX_SEARCHES_PER_USER) {
    return NextResponse.json(
      { ok: false, error: "Saved search limit reached" },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const row: typeof savedSearches.$inferInsert = {
    id: crypto.randomUUID(),
    userId: auth.userId,
    label,
    filters: JSON.stringify(filters),
    locale,
    alertEnabled: 1,
    alertFrequency: "weekly",
    unsubscribeToken: newUnsubscribeToken(),
    lastAlertAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(savedSearches).values(row);

  return NextResponse.json({
    ok: true,
    search: serializeRow(row as typeof savedSearches.$inferSelect),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const db = await getDb();
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });

  let body: { id?: unknown; alertEnabled?: unknown; label?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  const set: Partial<typeof savedSearches.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (typeof body.alertEnabled === "boolean") {
    set.alertEnabled = body.alertEnabled ? 1 : 0;
  }
  if (typeof body.label === "string" && body.label.trim()) {
    set.label = body.label.trim().slice(0, MAX_LABEL_LENGTH);
  }

  const updated = await db
    .update(savedSearches)
    .set(set)
    .where(and(eq(savedSearches.id, body.id), eq(savedSearches.userId, auth.userId)))
    .returning()
    .get();
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, search: serializeRow(updated) });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const db = await getDb();
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, body.id), eq(savedSearches.userId, auth.userId)));

  return NextResponse.json({ ok: true });
}
