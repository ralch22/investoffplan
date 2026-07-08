import "server-only";

import { getCatalogApi } from "@/lib/catalog";
import rawManifest from "../../data/asset-migration.json";

/**
 * Only serve /cdn images that were actually migrated — a missing R2 object
 * renders a black hero site-wide (105-residences incident, 2026-07-08).
 * Non-/cdn URLs (absolute upstream) pass through untouched.
 */
const uploadedKeys = new Set(
  Object.keys((rawManifest as { uploaded?: Record<string, unknown> }).uploaded ?? {}),
);

function isServableImage(url: string | undefined): url is string {
  if (!url) return false;
  if (!url.startsWith("/cdn/")) return true;
  return uploadedKeys.has(url.slice(5));
}

export async function getAreaImage(areaName: string): Promise<string | undefined> {
  const api = await getCatalogApi();
  const candidates = api.projects.filter((p) => p.area === areaName);
  return (
    candidates.map((p) => p.imageUrl).find(isServableImage) ??
    candidates.flatMap((p) => p.imageGallery ?? []).find(isServableImage)
  );
}

export async function getHeroImage(): Promise<string | undefined> {
  const api = await getCatalogApi();
  for (const project of api.projects) {
    if (isServableImage(project.imageUrl)) return project.imageUrl;
  }
  return undefined;
}
