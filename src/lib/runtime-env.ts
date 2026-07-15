/**
 * True only on the real Cloudflare Workers runtime (deployed worker or
 * `wrangler dev`), false under Node (`next start` — the e2e server — and
 * `next dev`).
 *
 * NOTE: getCloudflareContext() is NOT a valid discriminator — OpenNext's dev
 * initialization provides a working context (with real local D1 bindings)
 * under plain `next start` too, which is exactly how local e2e reaches D1.
 * The workerd runtime instead identifies itself via navigator.userAgent
 * (https://developers.cloudflare.com/workers/runtime-apis/web-standards/).
 */
export function isWorkersRuntime(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers"
  );
}
