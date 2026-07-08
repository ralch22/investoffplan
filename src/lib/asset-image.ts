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
  return false;
}

/** Convenience to spread unoptimized only when needed. */
export function unoptimizedProp(src?: string | null): { unoptimized: boolean } | {} {
  return shouldUnoptimize(src) ? { unoptimized: true } : {};
}
