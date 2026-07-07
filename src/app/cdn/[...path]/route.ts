import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const PREVIEW_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://investoffplan-preview.emerge-digital.workers.dev";

function contentTypeFromKey(key: string): string {
  if (key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  if (key.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

function headersFromR2(object: R2ObjectBody, key: string): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", CACHE_CONTROL);
  if (!headers.get("content-type")) {
    headers.set("content-type", contentTypeFromKey(key));
  }
  return headers;
}

/** Local Miniflare R2 is empty unless assets:migrate:local has run; proxy preview in dev. */
async function fetchPreviewAsset(key: string): Promise<Response | null> {
  const response = await fetch(`${PREVIEW_ORIGIN}/cdn/${key}`, {
    headers: { accept: "*/*" },
  });
  if (!response.ok) return null;

  const headers = new Headers(response.headers);
  if (!headers.get("cache-control")) {
    headers.set("cache-control", CACHE_CONTROL);
  }
  return new Response(response.body, { status: 200, headers });
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

  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.ASSETS_R2_BUCKET;
  if (!bucket) {
    return new Response("Asset storage unavailable", { status: 503 });
  }

  const object = await bucket.get(key);
  if (object) {
    return new Response(object.body, { headers: headersFromR2(object, key) });
  }

  if (process.env.NODE_ENV === "development") {
    const preview = await fetchPreviewAsset(key);
    if (preview) return preview;
  }

  return new Response("Not found", { status: 404 });
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}