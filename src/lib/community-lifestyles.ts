export type LifestyleSlug =
  | "family-friendly"
  | "waterfront"
  | "urban"
  | "golf"
  | "investment"
  | "luxury";

export interface LifestyleCategory {
  slug: LifestyleSlug;
  label: string;
  description: string;
  emoji: string;
}

export const LIFESTYLE_CATEGORIES: LifestyleCategory[] = [
  {
    slug: "family-friendly",
    label: "Family-friendly",
    description: "Spacious communities with parks, schools, and suburban calm.",
    emoji: "👨‍👩‍👧",
  },
  {
    slug: "waterfront",
    label: "Waterfront & beach",
    description: "Marina, creek, and island living with coastal amenities.",
    emoji: "🌊",
  },
  {
    slug: "urban",
    label: "Urban & central",
    description: "Walkable city cores, business districts, and skyline views.",
    emoji: "🏙️",
  },
  {
    slug: "golf",
    label: "Golf & green",
    description: "Master-planned estates with golf courses and landscaped living.",
    emoji: "⛳",
  },
  {
    slug: "investment",
    label: "Investment hotspots",
    description: "High-velocity districts with strong off-plan launch activity.",
    emoji: "📈",
  },
  {
    slug: "luxury",
    label: "Luxury & prestige",
    description: "Ultra-prime addresses and branded residences.",
    emoji: "✨",
  },
];

/** Curated lifestyle tags keyed by area slug (from catalog area names). */
export const AREA_LIFESTYLES: Record<string, LifestyleSlug[]> = {
  "dubai-hills-estate": ["family-friendly", "golf", "luxury"],
  "arabian-ranches": ["family-friendly", "golf"],
  "arabian-ranches-3": ["family-friendly", "golf"],
  "town-square": ["family-friendly", "investment"],
  "jumeirah-village-circle": ["family-friendly", "investment"],
  "dubai-sports-city": ["family-friendly", "investment"],
  "mohammed-bin-rashid-city": ["family-friendly", "investment"],
  "dubai-creek-harbour": ["waterfront", "urban", "luxury"],
  "dubai-marina": ["waterfront", "urban"],
  "dubai-maritime-city": ["waterfront", "urban"],
  "palm-jumeirah": ["waterfront", "luxury"],
  "palm-jebel-ali": ["waterfront", "investment"],
  "jumeirah": ["waterfront", "luxury"],
  "business-bay": ["urban", "investment"],
  "downtown-dubai": ["urban", "luxury"],
  "dubai-south": ["investment"],
  "dubai-production-city": ["investment"],
  "al-furjan": ["family-friendly", "investment"],
  "damac-hills": ["golf", "family-friendly"],
  "damac-hills-2": ["golf", "family-friendly"],
  "emaar-south": ["investment", "family-friendly"],
  "rashid-yachts-marina": ["waterfront", "luxury"],
  "mina-rashid": ["waterfront", "urban"],
  "jumeirah-lake-towers": ["urban", "investment"],
  "dubai-investment-park": ["investment"],
  "dubai-land": ["family-friendly", "investment"],
  "al-barsha": ["urban", "family-friendly"],
  "city-walk": ["urban", "luxury"],
  "bluewaters": ["waterfront", "luxury"],
  "saadiyat-island": ["waterfront", "luxury", "family-friendly"],
  "yas-island": ["family-friendly", "waterfront"],
  "reem-island": ["waterfront", "investment"],
  "al-reem-island": ["waterfront", "investment"],
};

const LIFESTYLE_KEYWORDS: Record<LifestyleSlug, RegExp> = {
  "family-friendly":
    /ranches|town square|village circle|sports city|furjan|mohammed bin rashid|mbc|jvc|damac hills 2|arabian ranches|tilal|villanova|the valley|mudon/i,
  waterfront:
    /marina|palm|creek|harbour|harbor|beach|island|coast|yacht|mina|bluewaters|waterfront|maritime/i,
  urban: /downtown|business bay|city walk|difc|jlt|jumeirah lake|sheikh zayed|al barsha|culture village/i,
  golf: /hills estate|damac hills|arabian ranches|golf|villanova|mudon/i,
  investment:
    /south|production city|dip|investment park|jvc|town square|sports city|arjan|international city|dubailand/i,
  luxury:
    /palm jumeirah|downtown|creek harbour|bluewaters|saadiyat|emirates hills|jumeirah bay|mbr city|city walk|rashid yachts/i,
};

export function inferLifestyles(areaSlug: string, areaName: string): LifestyleSlug[] {
  const curated = AREA_LIFESTYLES[areaSlug];
  if (curated?.length) return curated;

  const haystack = `${areaSlug} ${areaName}`;
  const inferred: LifestyleSlug[] = [];
  for (const cat of LIFESTYLE_CATEGORIES) {
    if (LIFESTYLE_KEYWORDS[cat.slug].test(haystack)) {
      inferred.push(cat.slug);
    }
  }
  return inferred.length ? inferred : ["investment"];
}

export function getLifestyleCategory(slug: LifestyleSlug): LifestyleCategory {
  return LIFESTYLE_CATEGORIES.find((c) => c.slug === slug)!;
}