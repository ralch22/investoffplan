import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { userFavorites } from "@/lib/db/schema";
import { getSessionFromRequest } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Slugs are lowercase kebab identifiers; anything else is rejected.
const SLUG_RE = /^[a-z0-9-]{1,100}$/;
const BULK_CAP = 500;

interface FavoritesBody {
  slugs?: unknown;
  slug?: unknown;
  action?: unknown;
}

function isValidSlug(v: unknown): v is string {
  return typeof v === "string" && SLUG_RE.test(v);
}

async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) return null;
  return session;
}

async function listSlugs(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ slug: userFavorites.projectSlug })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))
    .orderBy(asc(userFavorites.createdAt));
  return rows.map((r) => r.slug);
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Favorites store unavailable" },
      { status: 503 },
    );
  }
  const slugs = await listSlugs(db, session.user.id);
  return NextResponse.json({ ok: true, slugs });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let body: FavoritesBody;
  try {
    body = (await request.json()) as FavoritesBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Favorites store unavailable" },
      { status: 503 },
    );
  }

  const userId = session.user.id;
  const now = new Date().toISOString();

  // Single mutation: { slug, action: "add" | "remove" }.
  if (typeof body.slug === "string" || typeof body.action === "string") {
    if (!isValidSlug(body.slug)) {
      return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
    }
    if (body.action !== "add" && body.action !== "remove") {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }
    if (body.action === "add") {
      await db
        .insert(userFavorites)
        .values({ userId, projectSlug: body.slug, createdAt: now })
        .onConflictDoNothing();
    } else {
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.projectSlug, body.slug),
          ),
        );
    }
    const slugs = await listSlugs(db, userId);
    return NextResponse.json({ ok: true, slugs });
  }

  // Bulk UNION merge: { slugs: string[] } — insert what's missing, never
  // delete. The client follows up with a GET (or uses this response) to pull
  // the merged set back down.
  if (!Array.isArray(body.slugs)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const incoming = [...new Set(body.slugs.filter(isValidSlug))].slice(0, BULK_CAP);
  if (incoming.length > 0) {
    // D1 caps bound parameters per statement; chunk conservatively.
    const CHUNK = 50;
    for (let i = 0; i < incoming.length; i += CHUNK) {
      await db
        .insert(userFavorites)
        .values(
          incoming
            .slice(i, i + CHUNK)
            .map((slug) => ({ userId, projectSlug: slug, createdAt: now })),
        )
        .onConflictDoNothing();
    }
  }
  const slugs = await listSlugs(db, userId);
  return NextResponse.json({ ok: true, slugs });
}
