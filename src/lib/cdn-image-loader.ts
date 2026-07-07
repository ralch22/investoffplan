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
  if (src.startsWith("/cdn/")) {
    return src;
  }

  const q = quality ?? 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}