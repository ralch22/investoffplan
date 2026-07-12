/**
 * Client-safe {slug,label} list of the location guides, for the header mega
 * menu. `location-guides.ts` transitively imports the server-only catalog, so
 * client components must NOT import it — they import this instead.
 * Keep in sync with LOCATION_GUIDES in location-guides.ts (5 stable entries),
 * including `labelAr` ↔ `guide.ar.label`.
 */
export const LOCATION_GUIDE_LINKS: {
  slug: string;
  label: string;
  /** Arabic mega-nav label — mirrors LOCATION_GUIDES[].ar.label (#317). */
  labelAr: string;
}[] = [
  {
    slug: "best-communities-for-families",
    label: "Best for families",
    labelAr: "الأفضل للعائلات",
  },
  {
    slug: "highest-rental-yield-communities",
    label: "Highest yields",
    labelAr: "أعلى عوائد",
  },
  {
    slug: "most-affordable-communities",
    label: "Most affordable",
    labelAr: "الأكثر تناسبًا",
  },
  {
    slug: "best-value-communities",
    label: "Best value / sqft",
    labelAr: "أفضل قيمة/قدم²",
  },
  {
    slug: "most-liquid-communities",
    label: "Most liquid",
    labelAr: "الأكثر سيولة",
  },
];
