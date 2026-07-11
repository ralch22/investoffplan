import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { savedSearches } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/** Constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (aBytes[i % aBytes.length] ?? 0) ^ (bBytes[i % bBytes.length] ?? 0);
  }
  return diff === 0;
}

function page(title: string, body: string, status = 200): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;color:#1a1a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
main{background:#fff;border-radius:12px;max-width:420px;padding:40px 32px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.08)}
h1{font-size:20px;margin:0 0 12px}
p{font-size:14px;line-height:22px;color:#6b7280;margin:0 0 20px}
a{display:inline-block;background:#e60000;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:10px 24px;border-radius:999px}
</style>
</head>
<body><main><h1>${title}</h1><p>${body}</p><a href="${SITE_URL}">invest off-plan</a></main></body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * No-login unsubscribe: token-guarded (constant-time compare against the
 * per-search unsubscribe_token) → alert_enabled = 0. Idempotent — repeat
 * clicks land on the same confirmation. POST supports RFC 8058 one-click
 * List-Unsubscribe-Post from mail clients.
 */
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!id || !token) {
    return page("Invalid link", "This unsubscribe link is missing its parameters.", 400);
  }

  const db = await getDb();
  if (!db) {
    return page("Temporarily unavailable", "Please try again in a few minutes.", 503);
  }

  const row = await db
    .select({ id: savedSearches.id, unsubscribeToken: savedSearches.unsubscribeToken })
    .from(savedSearches)
    .where(eq(savedSearches.id, id))
    .get();

  if (!row || !timingSafeEqual(token, row.unsubscribeToken)) {
    return page("Invalid link", "This unsubscribe link is not valid.", 404);
  }

  const stamp = new Date().toISOString();
  await db
    .update(savedSearches)
    .set({ alertEnabled: 0, updatedAt: stamp })
    .where(eq(savedSearches.id, row.id));

  return page(
    "You're unsubscribed",
    "You'll no longer receive email alerts for this saved search. You can re-enable it any time from your account page.",
  );
}

export async function GET(request: Request) {
  return handle(request);
}

// RFC 8058 one-click unsubscribe (mail clients POST to the List-Unsubscribe URL).
export async function POST(request: Request) {
  return handle(request);
}
