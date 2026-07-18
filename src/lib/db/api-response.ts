import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "./client";
import { isCatalogDbSeeded } from "./catalog-queries";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

// Params the catalog API understands, in canonical order. Anything else (or a
// param at its default) is dropped from the cache key so the dominant traffic
// (default listing + one-filter views) collapses onto a handful of keys.
const KEY_PARAMS: Array<[name: string, defaultValue: string]> = [
  // Client cache-version key (catalog-browser.ts appends ?v=<scrapedAt> with
  // force-cache). MUST stay in the edge key: if versions collapsed onto one
  // entry, a post-ingest request could be served the previous week's body and
  // the browser would then pin that stale body under the NEW version URL.
  ["v", ""],
  ["q", ""],
  ["city", "all"],
  ["propertyType", "all"],
  ["beds", "all"],
  ["minPrice", ""],
  ["maxPrice", ""],
  ["developer", "all"],
  ["payment", "all"],
  ["handoverBy", "all"],
  ["amenities", ""],
  ["view", "project"],
  ["sort", "featured"],
  ["collection", "all"],
  ["page", "1"],
  ["pageSize", "24"],
];

// Workers-specific `caches.default` isn't in the DOM CacheStorage type.
function workersDefaultCache(): Cache | null {
  const store = globalThis.caches as CacheStorage & { default?: Cache };
  return store?.default ?? null;
}

function normalizeCatalogCacheUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    // Opaque cursors would pollute the cache — skip caching those requests.
    if (url.searchParams.get("cursor")) return null;
    const normalized = new URL(url.origin + url.pathname);
    for (const [name, def] of KEY_PARAMS) {
      const value = url.searchParams.get(name);
      if (value != null && value !== def) normalized.searchParams.set(name, value);
    }
    return normalized.toString();
  } catch {
    return null;
  }
}

/**
 * Shared wrapper for the public /api/catalog/* GET routes.
 *
 * `s-maxage` alone does NOTHING for Worker-generated responses — the zone
 * cache doesn't store them. The explicit Cache API below is what actually
 * makes repeat hits free in production (custom-domain routes; it is a silent
 * no-op on the preview *.workers.dev host). Pass `request` to opt a route in.
 */
export async function withCatalogDb<T>(
  handler: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>,
  opts?: { request?: Request },
) {
  const cacheUrl = opts?.request ? normalizeCatalogCacheUrl(opts.request.url) : null;

  const edgeCache = cacheUrl ? workersDefaultCache() : null;

  if (cacheUrl && edgeCache) {
    try {
      const hit = await edgeCache.match(new Request(cacheUrl));
      if (hit) {
        const res = new Response(hit.body, hit);
        res.headers.set("x-iop-cache", "hit");
        return res;
      }
    } catch {
      // Cache API unavailable (local next start) — fall through to the handler.
    }
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      {
        error: "catalog_database_unavailable",
        message: "D1 binding DB is not configured for this environment.",
      },
      { status: 503 },
    );
  }

  const seeded = await isCatalogDbSeeded(db);
  if (!seeded) {
    return NextResponse.json(
      {
        error: "catalog_database_empty",
        message: "Run npm run db:migrate:local && npm run db:seed:local to populate D1.",
      },
      { status: 503 },
    );
  }

  let payload: T;
  try {
    payload = await handler(db);
  } catch (error) {
    // A throw inside a catalog handler otherwise bubbles to Next's default 500
    // HTML shell. Return a clean JSON error instead, and never echo the raw
    // message (avoid leaking internal/D1 details to the client).
    console.error("[catalog-api] handler error:", error);
    return NextResponse.json(
      { error: "catalog_request_failed" },
      { status: 500 },
    );
  }
  if (payload instanceof Response) return payload;

  const res = NextResponse.json(payload, {
    headers: { "Cache-Control": CACHE_CONTROL, "x-iop-cache": "miss" },
  });

  if (cacheUrl && edgeCache) {
    try {
      const { ctx } = await getCloudflareContext({ async: true });
      ctx.waitUntil(edgeCache.put(new Request(cacheUrl), res.clone()));
    } catch {
      // Not on Workers (or no waitUntil) — serve uncached.
    }
  }

  return res;
}
