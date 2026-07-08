/**
 * Helpers for deciding Next.js Image optimization behavior.
 * R2 /cdn assets and SVGs must bypass the image optimizer on Cloudflare Workers
 * (see cdn-image-loader.ts and commits for bypass rationale).
 */

export function shouldUnoptimize(src?: string | null): boolean {
  if (!src) return false;
  const s = src.toLowerCase();
  if (s.startsWith("/cdn/") || s.startsWith("/brand/")) return true;
  if (s.endsWith(".svg")) return true;
  // Absolute external images (PF media + enrichment developer galleries, issue
  // #37) are hotlinked directly rather than proxied through the Worker image
  // optimizer. This keeps the optimizer from fetching arbitrary hosts — the
  // SSRF/open-proxy risk a wildcard `remotePatterns` would have introduced.
  if (s.startsWith("http://") || s.startsWith("https://")) return true;
  return false;
}

/** Convenience to spread unoptimized only when needed. */
export function unoptimizedProp(src?: string | null): { unoptimized: boolean } | {} {
  return shouldUnoptimize(src) ? { unoptimized: true } : {};
}
