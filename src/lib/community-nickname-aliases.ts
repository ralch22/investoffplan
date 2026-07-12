/**
 * Short community nicknames → canonical `/communities/{slug}` targets.
 *
 * Complements area-variant redirects in `src/app/(en)/areas/[slug]/page.tsx`
 * (breadcrumb variants like `jumeirah-village-circle-district-13-…` fold into
 * the community via `communityForVariantSlug`). Those only cover catalog
 * area slugs — not marketing nicknames people type in the URL bar
 * (`/areas/jvc`, `/communities/jlt`, …).
 *
 * Wired as permanent redirects in `next.config.ts` (EN + `/ar`, both
 * `/areas/{nick}` and `/communities/{nick}`). Leaf module so next.config can
 * import without pulling the catalog stack.
 *
 * Rules:
 * - Alias ≠ canonical (no self-redirects / loops).
 * - Every destination slug is a real community in the catalog
 *   (slugify of first breadcrumb segment of project.area).
 * - Do not invent communities that are not in the catalog.
 *
 * Related: search typeahead aliases in `src/lib/search-aliases.ts` (multi-word
 * free-text keys); developer brand aliases in `next.config.ts`.
 */

/** nickname path segment → canonical community slug */
export const COMMUNITY_NICKNAME_ALIASES: Readonly<Record<string, string>> = {
  // Major Dubai marketing nicknames (live audit #198 / issue #204)
  jvc: "jumeirah-village-circle",
  jlt: "jumeirah-lake-towers",
  // Plural marketing spelling (catalog slug is singular "lake")
  "jumeirah-lakes-towers": "jumeirah-lake-towers",
  jvt: "jumeirah-village-triangle",
  jbr: "jumeirah-beach-residence",
  mbr: "mohammed-bin-rashid-city",
  "mbr-city": "mohammed-bin-rashid-city",
  d1: "downtown-dubai",
  downtown: "downtown-dubai",
  marina: "dubai-marina",
  creek: "dubai-creek-harbour-the-lagoons",
  "creek-harbour": "dubai-creek-harbour-the-lagoons",
  "dubai-creek-harbour": "dubai-creek-harbour-the-lagoons",
  palm: "palm-jumeirah",
  hills: "dubai-hills-estate",
  "dubai-hills": "dubai-hills-estate",
  dso: "dubai-silicon-oasis",
  "silicon-oasis": "dubai-silicon-oasis",
  dip: "dubai-investment-park-dip",
  "dubai-investment-park": "dubai-investment-park-dip",
  d3: "dubai-design-district",
  "design-district": "dubai-design-district",
  dubailand: "dubai-land",
  jge: "jumeirah-golf-estates",
  saadiyat: "saadiyat-island",
  "dubai-south": "dubai-south-dubai-world-central",
  "reem-island": "al-reem-island",
  "al-marjan": "al-marjan-island",
  "the-oasis": "the-oasis-by-emaar",
};

/** Resolve a short nickname to its canonical community slug, or null. */
export function canonicalCommunitySlugForNickname(
  nickname: string,
): string | null {
  const key = nickname.trim().toLowerCase();
  if (!key) return null;
  return COMMUNITY_NICKNAME_ALIASES[key] ?? null;
}
