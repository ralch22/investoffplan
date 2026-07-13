import type { Dict } from "@/i18n";
import { cityLabel } from "@/lib/format";
import type { Coordinates } from "@/lib/types";

/**
 * Google Maps URL for a project location CTA.
 * Prefer lat/lng when present; otherwise search by area + locale-aware city
 * (never force "Dubai UAE" — #381).
 */
export function projectGoogleMapsUrl(
  project: {
    coordinates?: Coordinates | null;
    area?: string | null;
    city: string;
  },
  dict: Dict,
): string {
  const coords = project.coordinates;
  if (coords != null && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  }
  const city = cityLabel(project.city, dict);
  const area = project.area?.trim();
  const query = area ? `${area}, ${city}, UAE` : `${city}, UAE`;
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}
