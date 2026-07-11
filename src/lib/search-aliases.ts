// Pure, client-safe alias map for smart search — EN + AR shorthand → canonical
// entities. Every slug below is VERIFIED against data/catalog.json:
//   communities = slugified first breadcrumb segment of project.area
//   developers  = devList[].slug
//   cities      = citySlug values present in the catalog
// NOTE: alias keys are matched after normText() (lowercase, diacritics/hamza
// stripped), so keys here are written in already-normalized form (e.g. "اعمار"
// not "إعمار"). JBR has no community in the catalog data, so it is omitted.

export type AliasKind = "community" | "developer" | "city";

export interface SearchAlias {
  kind: AliasKind;
  slug: string;
  /** Display label; for communities/developers the index label wins if present. */
  label: string;
}

/** Keys must be pre-normalized: lowercase ASCII / bare-alef Arabic. */
export const SEARCH_ALIASES: Record<string, SearchAlias> = {
  // --- Communities (EN) ---
  jvc: { kind: "community", slug: "jumeirah-village-circle", label: "Jumeirah Village Circle" },
  "jumeirah village circle": { kind: "community", slug: "jumeirah-village-circle", label: "Jumeirah Village Circle" },
  jlt: { kind: "community", slug: "jumeirah-lake-towers", label: "Jumeirah Lake Towers" },
  "jumeirah lakes towers": { kind: "community", slug: "jumeirah-lake-towers", label: "Jumeirah Lake Towers" },
  "jumeirah lake towers": { kind: "community", slug: "jumeirah-lake-towers", label: "Jumeirah Lake Towers" },
  jvt: { kind: "community", slug: "jumeirah-village-triangle", label: "Jumeirah Village Triangle" },
  mbr: { kind: "community", slug: "mohammed-bin-rashid-city", label: "Mohammed Bin Rashid City" },
  "mbr city": { kind: "community", slug: "mohammed-bin-rashid-city", label: "Mohammed Bin Rashid City" },
  "mohammed bin rashid city": { kind: "community", slug: "mohammed-bin-rashid-city", label: "Mohammed Bin Rashid City" },
  d1: { kind: "community", slug: "downtown-dubai", label: "Downtown Dubai" },
  downtown: { kind: "community", slug: "downtown-dubai", label: "Downtown Dubai" },
  "downtown dubai": { kind: "community", slug: "downtown-dubai", label: "Downtown Dubai" },
  marina: { kind: "community", slug: "dubai-marina", label: "Dubai Marina" },
  "dubai marina": { kind: "community", slug: "dubai-marina", label: "Dubai Marina" },
  "business bay": { kind: "community", slug: "business-bay", label: "Business Bay" },
  creek: { kind: "community", slug: "dubai-creek-harbour-the-lagoons", label: "Dubai Creek Harbour" },
  "creek harbour": { kind: "community", slug: "dubai-creek-harbour-the-lagoons", label: "Dubai Creek Harbour" },
  "dubai creek harbour": { kind: "community", slug: "dubai-creek-harbour-the-lagoons", label: "Dubai Creek Harbour" },
  palm: { kind: "community", slug: "palm-jumeirah", label: "Palm Jumeirah" },
  "palm jumeirah": { kind: "community", slug: "palm-jumeirah", label: "Palm Jumeirah" },
  "palm jebel ali": { kind: "community", slug: "palm-jebel-ali", label: "Palm Jebel Ali" },
  hills: { kind: "community", slug: "dubai-hills-estate", label: "Dubai Hills Estate" },
  "dubai hills": { kind: "community", slug: "dubai-hills-estate", label: "Dubai Hills Estate" },
  "dubai hills estate": { kind: "community", slug: "dubai-hills-estate", label: "Dubai Hills Estate" },
  "damac hills 2": { kind: "community", slug: "damac-hills-2", label: "Damac Hills 2" },
  "damac lagoons": { kind: "community", slug: "damac-lagoons", label: "Damac Lagoons" },
  meydan: { kind: "community", slug: "meydan", label: "Meydan" },
  "expo city": { kind: "community", slug: "expo-city", label: "Expo City" },
  dso: { kind: "community", slug: "dubai-silicon-oasis", label: "Dubai Silicon Oasis" },
  "silicon oasis": { kind: "community", slug: "dubai-silicon-oasis", label: "Dubai Silicon Oasis" },
  difc: { kind: "community", slug: "difc", label: "DIFC" },
  "city walk": { kind: "community", slug: "city-walk", label: "City Walk" },
  "dubai south": { kind: "community", slug: "dubai-south-dubai-world-central", label: "Dubai South" },
  dip: { kind: "community", slug: "dubai-investment-park-dip", label: "Dubai Investment Park (DIP)" },
  d3: { kind: "community", slug: "dubai-design-district", label: "Dubai Design District" },
  "design district": { kind: "community", slug: "dubai-design-district", label: "Dubai Design District" },
  dubailand: { kind: "community", slug: "dubai-land", label: "Dubailand" },
  "al furjan": { kind: "community", slug: "al-furjan", label: "Al Furjan" },
  arjan: { kind: "community", slug: "arjan", label: "Arjan" },
  "the valley": { kind: "community", slug: "the-valley", label: "The Valley" },
  "yas island": { kind: "community", slug: "yas-island", label: "Yas Island" },
  saadiyat: { kind: "community", slug: "saadiyat-island", label: "Saadiyat Island" },
  "saadiyat island": { kind: "community", slug: "saadiyat-island", label: "Saadiyat Island" },
  "reem island": { kind: "community", slug: "al-reem-island", label: "Al Reem Island" },
  "al marjan": { kind: "community", slug: "al-marjan-island", label: "Al Marjan Island" },
  "al marjan island": { kind: "community", slug: "al-marjan-island", label: "Al Marjan Island" },
  "dubai islands": { kind: "community", slug: "dubai-islands", label: "Dubai Islands" },
  "international city": { kind: "community", slug: "international-city", label: "International City" },
  "mina rashid": { kind: "community", slug: "mina-rashid", label: "Mina Rashid" },
  jge: { kind: "community", slug: "jumeirah-golf-estates", label: "Jumeirah Golf Estates" },
  "jumeirah golf estates": { kind: "community", slug: "jumeirah-golf-estates", label: "Jumeirah Golf Estates" },
  "the oasis": { kind: "community", slug: "the-oasis-by-emaar", label: "The Oasis by Emaar" },
  "motor city": { kind: "community", slug: "motor-city", label: "Motor City" },

  // --- Communities (AR, normalized: no hamza-above/below on alef) ---
  "دبي مارينا": { kind: "community", slug: "dubai-marina", label: "Dubai Marina" },
  "مارينا": { kind: "community", slug: "dubai-marina", label: "Dubai Marina" },
  "الخليج التجاري": { kind: "community", slug: "business-bay", label: "Business Bay" },
  "قرية جميرا الدائرية": { kind: "community", slug: "jumeirah-village-circle", label: "Jumeirah Village Circle" },
  "وسط مدينة دبي": { kind: "community", slug: "downtown-dubai", label: "Downtown Dubai" },
  "داون تاون": { kind: "community", slug: "downtown-dubai", label: "Downtown Dubai" },
  "نخلة جميرا": { kind: "community", slug: "palm-jumeirah", label: "Palm Jumeirah" },
  "خور دبي": { kind: "community", slug: "dubai-creek-harbour-the-lagoons", label: "Dubai Creek Harbour" },
  "دبي هيلز": { kind: "community", slug: "dubai-hills-estate", label: "Dubai Hills Estate" },
  "ميدان": { kind: "community", slug: "meydan", label: "Meydan" },

  // --- Developers (EN; slugs from devList) ---
  emaar: { kind: "developer", slug: "emaar-properties", label: "Emaar Properties" },
  "emaar properties": { kind: "developer", slug: "emaar-properties", label: "Emaar Properties" },
  damac: { kind: "developer", slug: "damac-properties", label: "DAMAC Properties" },
  "damac properties": { kind: "developer", slug: "damac-properties", label: "DAMAC Properties" },
  azizi: { kind: "developer", slug: "azizi-developments", label: "Azizi Developments" },
  sobha: { kind: "developer", slug: "sobha-realty", label: "Sobha Realty" },
  binghatti: { kind: "developer", slug: "binghatti-developers", label: "Binghatti Developers" },
  meraas: { kind: "developer", slug: "meraas-holding", label: "Meraas Holding" },
  samana: { kind: "developer", slug: "samana-developers", label: "Samana Developers" },
  aldar: { kind: "developer", slug: "aldar-properties-pjsc", label: "Aldar Properties" },
  imtiaz: { kind: "developer", slug: "imtiaz-developments", label: "Imtiaz Developments" },
  nakheel: { kind: "developer", slug: "nakheel", label: "Nakheel" },
  ellington: { kind: "developer", slug: "ellington", label: "Ellington" },
  arada: { kind: "developer", slug: "arada", label: "Arada" },

  // --- Developers (AR, normalized) ---
  "اعمار": { kind: "developer", slug: "emaar-properties", label: "Emaar Properties" },
  "داماك": { kind: "developer", slug: "damac-properties", label: "DAMAC Properties" },
  "عزيزي": { kind: "developer", slug: "azizi-developments", label: "Azizi Developments" },
  "شوبا": { kind: "developer", slug: "sobha-realty", label: "Sobha Realty" },
  "بن غاطي": { kind: "developer", slug: "binghatti-developers", label: "Binghatti Developers" },
  "نخيل": { kind: "developer", slug: "nakheel", label: "Nakheel" },

  // --- Cities (EN + AR; citySlug values) ---
  dubai: { kind: "city", slug: "dubai", label: "Dubai" },
  "abu dhabi": { kind: "city", slug: "abu-dhabi", label: "Abu Dhabi" },
  sharjah: { kind: "city", slug: "sharjah", label: "Sharjah" },
  ajman: { kind: "city", slug: "ajman", label: "Ajman" },
  rak: { kind: "city", slug: "rak", label: "Ras Al Khaimah" },
  "ras al khaimah": { kind: "city", slug: "rak", label: "Ras Al Khaimah" },
  "umm al quwain": { kind: "city", slug: "umm-al-quwain", label: "Umm Al Quwain" },
  uaq: { kind: "city", slug: "umm-al-quwain", label: "Umm Al Quwain" },
  fujairah: { kind: "city", slug: "fujairah", label: "Fujairah" },
  "دبي": { kind: "city", slug: "dubai", label: "Dubai" },
  "ابوظبي": { kind: "city", slug: "abu-dhabi", label: "Abu Dhabi" },
  "ابو ظبي": { kind: "city", slug: "abu-dhabi", label: "Abu Dhabi" },
  "الشارقة": { kind: "city", slug: "sharjah", label: "Sharjah" },
  "عجمان": { kind: "city", slug: "ajman", label: "Ajman" },
  "راس الخيمة": { kind: "city", slug: "rak", label: "Ras Al Khaimah" },
};
