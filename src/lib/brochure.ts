import { isHostedAssetUrl } from "@/lib/assets/keys";
import type { Project } from "./types";

export function resolveBrochureUrl(project: Project): string | undefined {
  return project.brochureUrl || project.masterPlanUrl;
}

export function isDownloadablePdfUrl(url?: string): boolean {
  if (!url) return false;
  if (isHostedAssetUrl(url)) return url.includes("/brochure");
  return url.startsWith("http://") || url.startsWith("https://");
}

export function hasDownloadableBrochure(project: Project): boolean {
  const url = resolveBrochureUrl(project);
  return isDownloadablePdfUrl(url);
}