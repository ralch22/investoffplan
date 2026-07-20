import { isHostedAssetUrl } from "@/lib/assets/keys";
import type { Project } from "./types";

export function resolveBrochureUrl(project: Project): string | undefined {
  return project.brochureUrl || project.masterPlanUrl;
}

// A brochure is only "downloadable" when it is a self-hosted /cdn asset. Raw
// third-party URLs (PropertyFinder, developer sites) are NEVER surfaced as a
// download — they leak a competitor link and bypass lead capture; the UI falls
// back to the WhatsApp brochure request instead.
export function isDownloadablePdfUrl(url?: string): boolean {
  if (!url) return false;
  return isHostedAssetUrl(url) && url.includes("/brochure");
}

/** The brochure URL only if it is a self-hosted downloadable PDF, else undefined. */
export function hostedBrochureUrl(url?: string): string | undefined {
  return isDownloadablePdfUrl(url) ? url : undefined;
}

export function hasDownloadableBrochure(project: Project): boolean {
  const url = resolveBrochureUrl(project);
  return isDownloadablePdfUrl(url);
}