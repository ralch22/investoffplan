const CDN_PREFIX = "/cdn";

export function isExternalAssetUrl(url?: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

export function isHostedAssetUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith(`${CDN_PREFIX}/`);
}

export function cdnUrlForKey(key: string): string {
  return `${CDN_PREFIX}/${key}`;
}

export function keyFromCdnUrl(url: string): string | null {
  if (!url.startsWith(`${CDN_PREFIX}/`)) return null;
  return url.slice(CDN_PREFIX.length + 1);
}

export function extensionFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/(\.[a-zA-Z0-9]+)(?:\?|$)/);
    if (match?.[1]) return match[1].toLowerCase();
  } catch {
    const match = url.match(/(\.[a-zA-Z0-9]+)(?:\?|$)/);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return fallback;
}

export function projectBrochureKey(slug: string, sourceUrl: string): string {
  const ext = extensionFromUrl(sourceUrl, ".pdf");
  return `projects/${slug}/brochure${ext}`;
}

export function projectHeroKey(slug: string, sourceUrl: string): string {
  const ext = extensionFromUrl(sourceUrl, ".jpg");
  return `projects/${slug}/hero${ext}`;
}

export function projectGalleryKey(
  slug: string,
  index: number,
  sourceUrl: string,
): string {
  const ext = extensionFromUrl(sourceUrl, ".jpg");
  const padded = String(index).padStart(3, "0");
  return `projects/${slug}/gallery/${padded}${ext}`;
}

export function developerLogoKey(developerSlug: string, sourceUrl: string): string {
  const ext = extensionFromUrl(sourceUrl, ".png");
  return `developers/${developerSlug}/logo${ext}`;
}

export function developerSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}