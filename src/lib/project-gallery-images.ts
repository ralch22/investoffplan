import type { Project } from "./types";

type GallerySource = {
  imageUrl?: string;
  imageGallery?: string[];
};

/**
 * PF (and some scrapers) put walkthrough videos in the same gallery array as
 * photos (`…/gallery/video/…`, `.mp4`). Those cannot render in <img>/Next Image
 * and show up as blank slides / missing photos on SERP + PDP.
 */
export function isDisplayableGalleryImage(url: string | undefined | null): url is string {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  if (!u) return false;
  if (/\/gallery\/video\//i.test(u)) return false;
  if (/\.mp4(?:$|\?)/i.test(u)) return false;
  if (/\.webm(?:$|\?)/i.test(u)) return false;
  if (/\.m3u8(?:$|\?)/i.test(u)) return false;
  return true;
}

export function normalizeGalleryUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(isDisplayableGalleryImage))];
}

/** Resolve displayable gallery URLs from project + optional catalog unit row. */
export function getProjectGalleryImages(
  project: GallerySource,
  catalog?: GallerySource,
): string[] {
  const fromProject = project.imageGallery?.filter(Boolean);
  if (fromProject?.length) {
    const cleaned = normalizeGalleryUrls(fromProject);
    if (cleaned.length) return cleaned;
  }

  const fromCatalog = catalog?.imageGallery?.filter(Boolean);
  if (fromCatalog?.length) {
    const cleaned = normalizeGalleryUrls(fromCatalog);
    if (cleaned.length) return cleaned;
  }

  const hero = catalog?.imageUrl ?? project.imageUrl;
  return isDisplayableGalleryImage(hero) ? [hero] : [];
}