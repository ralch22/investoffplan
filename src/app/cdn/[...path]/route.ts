import { getCloudflareContext } from "@opennextjs/cloudflare";

import rawManifest from "../../../../data/asset-migration.json";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function contentTypeFromKey(key: string): string {
  if (key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  if (key.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

interface UploadedEntry {
  sourceUrl: string;
}

interface AssetManifest {
  uploaded?: Record<string, UploadedEntry>;
}

const sourceMap = new Map<string, string>();
try {
  const manifest = rawManifest as AssetManifest;
  if (manifest.uploaded) {
    for (const [key, entry] of Object.entries(manifest.uploaded)) {
      if (entry?.sourceUrl) {
        sourceMap.set(key, entry.sourceUrl);
      }
    }
  }
} catch {
  // manifest optional; fallback will be limited to placeholder in dev
}

function getSourceUrlForKey(key: string): string | null {
  return sourceMap.get(key) ?? null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const key = path.join("/");

  if (!key || key.includes("..")) {
    return new Response("Invalid path", { status: 400 });
  }

  // Try R2 first (works in deployed / wrangler; may be absent in plain next dev)
  let bucket: R2Bucket | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    bucket = env.ASSETS_R2_BUCKET;
  } catch {
    bucket = undefined;
  }

  if (bucket) {
    const object = await bucket.get(key);
    if (object) {
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", CACHE_CONTROL);
      if (!headers.get("content-type")) {
        headers.set("content-type", contentTypeFromKey(key));
      }
      return new Response(object.body, { headers });
    }
  }

  // Fallback: proxy original source URL (dev, or not-yet-migrated assets)
  const sourceUrl = getSourceUrlForKey(key);
  if (sourceUrl) {
    try {
      const upstream = await fetch(sourceUrl, {
        headers: {
          "User-Agent":
            "InvestOffPlan-Asset/1.0 (+https://investoffplan.com)",
        },
      });
      if (upstream.ok && upstream.body) {
        const headers = new Headers();
        const ct =
          upstream.headers.get("content-type") || contentTypeFromKey(key);
        headers.set("content-type", ct);
        headers.set("cache-control", "public, max-age=86400");
        headers.set("x-asset-fallback", "origin");
        return new Response(upstream.body, { headers });
      }
    } catch {
      // ignore, fallthrough to 404
    }
  }

  // Last resort dev placeholder: serve a local image so Next <Image> gets valid bytes (no "not a valid image" errors)
  try {
    const { readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const fallback = join(process.cwd(), "public/images/creek-orchard.jpg");
    if (existsSync(fallback)) {
      const body = readFileSync(fallback);
      const headers = new Headers();
      headers.set("content-type", "image/jpeg");
      headers.set("cache-control", "no-store");
      headers.set("x-asset-fallback", "placeholder");
      return new Response(body, { headers });
    }
  } catch {
    // ignore
  }

  return new Response("Not found", { status: 404 });
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  // lightweight HEAD impl with R2 head + origin fallback (avoids full GET body)
  const { path } = await context.params;
  const key = path.join("/");

  if (!key || key.includes("..")) {
    return new Response(null, { status: 400 });
  }

  let bucket: R2Bucket | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    bucket = env.ASSETS_R2_BUCKET;
  } catch {
    bucket = undefined;
  }

  if (bucket) {
    const object = await bucket.head(key);
    if (object) {
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", CACHE_CONTROL);
      if (!headers.get("content-type")) {
        headers.set("content-type", contentTypeFromKey(key));
      }
      return new Response(null, { headers, status: 200 });
    }
  }

  const sourceUrl = getSourceUrlForKey(key);
  if (sourceUrl) {
    try {
      const headRes = await fetch(sourceUrl, { method: "HEAD" });
      if (headRes.ok) {
        const headers = new Headers();
        const ct = headRes.headers.get("content-type") || contentTypeFromKey(key);
        headers.set("content-type", ct);
        headers.set("cache-control", "public, max-age=86400");
        return new Response(null, { headers, status: 200 });
      }
    } catch {
      // ignore
    }
  }

  // In dev without R2/source, HEAD for asset keys succeed (GET will serve placeholder)
  if (key.includes("/projects/") || key.includes("/developers/") || key.includes("/gallery/")) {
    const headers = new Headers();
    headers.set("content-type", contentTypeFromKey(key));
    headers.set("cache-control", "no-store");
    return new Response(null, { headers, status: 200 });
  }

  return new Response(null, { status: 404 });
}
