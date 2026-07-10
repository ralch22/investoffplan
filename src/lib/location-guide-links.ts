/**
 * Client-safe {slug,label} list of the location guides, for the header mega
 * menu. `location-guides.ts` transitively imports the server-only catalog, so
 * client components must NOT import it — they import this instead.
 * Keep in sync with LOCATION_GUIDES in location-guides.ts (5 stable entries).
 */
export const LOCATION_GUIDE_LINKS: { slug: string; label: string }[] = [
  { slug: "best-communities-for-families", label: "Best for families" },
  { slug: "highest-rental-yield-communities", label: "Highest yields" },
  { slug: "most-affordable-communities", label: "Most affordable" },
  { slug: "best-value-communities", label: "Best value / sqft" },
  { slug: "most-liquid-communities", label: "Most liquid" },
];
