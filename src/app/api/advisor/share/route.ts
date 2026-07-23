import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { sharedSurfaces } from "@/lib/db/schema";
import { fetchProjectsBySlugs } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

/**
 * Persist a shareable advisor shortlist and return its link.
 *
 * The security model is "grounded ingredients only". This never accepts — and
 * the store never holds — composed A2UI JSON, because the client could then
 * choose what a `ProjectCard` renders, including its image URL. Instead it
 * takes project SLUGS, verifies every one of them resolves in the catalogue,
 * and stores only what survived. /s/[id] recomposes the surface server-side
 * from live data.
 *
 * The reply text is the one free-form field, and it is echoed back only to
 * whoever opens the link. It is capped, and it is rendered as text — never as
 * markdown/HTML — on the share page.
 */

/** Shares are cheap to make and outlive the session, so cap them harder than chat. */
const WINDOW_MS = 5 * 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

const MAX_REPLY_CHARS = 2_000;
const MAX_SLUGS = 6;
const TTL_DAYS = 30;

/** URL-safe, unguessable enough for an unlisted link (~10^18 space). */
function newId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

interface ShareBody {
  locale?: string;
  reply?: string;
  slugs?: string[];
  mortgagePriceAed?: number;
}

export async function POST(request: Request) {
  let body: ShareBody;
  try {
    body = (await request.json()) as ShareBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many shares — please wait a minute." }, { status: 429 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const reply = String(body.reply ?? "").trim().slice(0, MAX_REPLY_CHARS);
  const requested = (Array.isArray(body.slugs) ? body.slugs : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX_SLUGS);

  if (!requested.length) {
    return NextResponse.json({ error: "Nothing to share" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    // No binding (local e2e). Sharing is additive, so fail closed and quietly —
    // the widget keeps working, it just can't produce a link.
    return NextResponse.json({ error: "Sharing unavailable" }, { status: 503 });
  }

  // Grounding gate: only slugs the catalogue actually has may be stored.
  const found = await fetchProjectsBySlugs(db, requested);
  const known = new Set(found.map((p) => p.slug));
  const slugs = requested.filter((s) => known.has(s));
  if (!slugs.length) {
    return NextResponse.json({ error: "Nothing to share" }, { status: 400 });
  }

  const price =
    typeof body.mortgagePriceAed === "number" && body.mortgagePriceAed > 0
      ? Math.round(body.mortgagePriceAed)
      : null;

  const now = new Date();
  const expires = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const id = newId();

  try {
    await db
      .insert(sharedSurfaces)
      .values({
        id,
        locale,
        reply,
        slugsJson: JSON.stringify(slugs),
        mortgagePriceAed: price,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      })
      .run();
  } catch (error) {
    console.error("[advisor/share] insert failed", error);
    return NextResponse.json({ error: "Sharing unavailable" }, { status: 503 });
  }

  return NextResponse.json({ id, url: `/s/${id}` });
}
