/**
 * R2 object access over the Cloudflare REST API.
 *
 * Why not src/lib/assets/r2-cli.ts: that helper shells out to `npx wrangler r2
 * object put` per object (~2s of process spawn each). At 17,927 catalog assets
 * that is ~10 hours. These are plain authenticated HTTPS calls, so they can run
 * concurrently — the same backfill lands in ~30 minutes. r2-cli stays as-is for
 * the existing one-off scripts; nothing here changes their behaviour.
 *
 * Auth: CLOUDFLARE_API_TOKEN (the same gh/ingest token; verified 2026-07-17 to
 * carry R2 read+write on this account).
 */

const API = "https://api.cloudflare.com/client/v4";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[r2-rest] ${name} is required`);
  return v;
}

function objectUrl(bucket: string, key: string): string {
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  // Keys contain "/" which must stay literal path separators, so encode the
  // segments individually rather than the whole key.
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${API}/accounts/${accountId}/r2/buckets/${bucket}/objects/${encoded}`;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${requireEnv("CLOUDFLARE_API_TOKEN")}` };
}

/** True when the object already exists — the cheap idempotency check. */
export async function r2ObjectExists(bucket: string, key: string): Promise<boolean> {
  const res = await fetch(objectUrl(bucket, key), {
    method: "HEAD",
    headers: authHeaders(),
  });
  return res.ok;
}

export async function r2PutObject(
  bucket: string,
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const res = await fetch(objectUrl(bucket, key), {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": contentType,
      // Mirrors r2-cli's CACHE_CONTROL: these are content-addressed, so the
      // bytes behind a key never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`[r2-rest] PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}
