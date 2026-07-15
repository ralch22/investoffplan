import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * True only on a deployed/simulated Cloudflare Workers runtime — false under
 * plain `next start` (the e2e server) and `next dev`.
 *
 * This is the ONLY reliable "am I production-shaped?" discriminator here:
 * `.env.production` (NEXT_PUBLIC_SITE_URL etc.) is loaded by local
 * `next start` too, so URL/NODE_ENV checks misclassify local e2e.
 */
export async function isWorkersRuntime(): Promise<boolean> {
  try {
    await getCloudflareContext({ async: true });
    return true;
  } catch {
    return false;
  }
}
