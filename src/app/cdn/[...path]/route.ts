import { getCloudflareContext } from "@opennextjs/cloudflare";

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
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", CACHE_CONTROL);
  if (!headers.get("content-type")) {
    headers.set("content-type", contentTypeFromKey(key));
  }

  return new Response(object.body, { headers });
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