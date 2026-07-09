// Safe default = the production domain. NEXT_PUBLIC_* is baked at BUILD time
// (wrangler vars never reach prerendered pages), so a missing env var must not
// leak the preview domain into canonical/og/hreflang tags site-wide.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://investoffplan.com";

export function getSiteUrl(): string {
  return SITE_URL;
}