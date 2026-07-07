import type { Project } from "./types";

type GallerySource = {
  imageUrl?: string;
  imageGallery?: string[];
};

export function normalizeGalleryUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

/** Resolve displayable gallery URLs from project + optional catalog unit row. */
export function getProjectGalleryImages(
  project: GallerySource,
  catalog?: GallerySource,
): string[] {
  const fromProject = project.imageGallery?.filter(Boolean);
  if (fromProject?.length) return normalizeGalleryUrls(fromProject);

  const fromCatalog = catalog?.imageGallery?.filter(Boolean);
  if (fromCatalog?.length) return normalizeGalleryUrls(fromCatalog);

  const hero = catalog?.imageUrl ?? project.imageUrl;
  return hero ? [hero] : [];
}