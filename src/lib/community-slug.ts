// Pure, client-safe community-slug helpers (no catalog/server imports).
import { slugify } from "@/lib/slugify";

/** First breadcrumb segment — IOP area names are "Community, District, Project". */
export function firstSegment(areaName: string): string {
  return (areaName.split(",")[0] ?? areaName).trim();
}

/** Canonical community slug for any raw catalog area name. */
export function communitySlugFor(areaName: string): string {
  return slugify(firstSegment(areaName));
}
