import type { ImageLoaderProps } from "next/image";

/**
 * OpenNext on Cloudflare resolves /_next/image relative URLs via env.ASSETS (static
 * .open-next/assets), not the dynamic /cdn R2 route — so optimizer requests 404.
 * R2 assets are already WebP; serve /cdn paths directly.
 */
export default function cdnImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  // R2 catalog assets + static brand SVGs: serve directly. Workers image optimizer
  // cannot fetch /cdn from ASSETS, and rejects SVGs unless allowSvg is enabled.
  if (src.startsWith("/cdn/") || src.startsWith("/brand/")) {
    return src;
  }

  const q = quality ?? 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}