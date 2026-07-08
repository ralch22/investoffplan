export type CitySlug =
  | "all"
  | "dubai"
  | "abu-dhabi"
  | "sharjah"
  | "rak"
  | "ajman"
  | "umm-al-quwain"
  | "fujairah"
  | "al-ain";

export type PropertyType =
  | "apartment"
  | "villa"
  | "townhouse"
  | "penthouse"
  | "multiple"
  | string;

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "value-asc"
  | "handover-asc"
  | "handover-desc";

export type CollectionFilter =
  | "all"
  | "premium"
  | "brochure"
  | "video"
  | "under-2m"
  | "studio"
  | "waterfront";

export type CurrencyCode = "AED" | "USD";

export type ViewMode = "unit" | "project";

export interface UnitType {
  id: string;
  beds: number;
  sqftMin: number;
  sqftMax?: number;
  launchPriceAed: number;
  launchPriceMaxAed?: number;
  propertyType: PropertyType;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Project {
  id: string;
  slug: string;
  pfSlug?: string;
  name: string;
  developer: string;
  developerInitials: string;
  developerLogo?: string;
  city: Exclude<CitySlug, "all">;
  citySlug?: string;
  area: string;
  locationFull?: string;
  minPriceAed?: number; // populated on lite slice for map support without units
  status: "off-plan" | "under-construction" | "ready" | "sold-out";
  handover?: string;
  paymentPlan: string;
  paymentPlanCount?: number;
  isPremium: boolean;
  unitCount: number;
  featuredRank?: number;
  imageGradient?: string;
  imageUrl?: string;
  imageGallery?: string[];
  videoAvailable?: boolean;
  coordinates?: Coordinates;
  brochureUrl?: string;
  description?: string;
  amenities?: string[];
  masterPlanUrl?: string;
  videoUrl?: string;
  floorPlans?: FloorPlan[];
  salesStartDate?: string;
  ownershipType?: string;
  constructionProgress?: number;
  pfFaqs?: Array<{ q: string; a: string }>;
  whatsapp: string;
  units: UnitType[];
}

export interface FloorPlan {
  beds: number;
  propertyType?: string;
  area?: number;
  layoutType?: string;
  imageUrl: string;
}

export interface CatalogUnit {
  id: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  pfSlug?: string;
  developer: string;
  developerLogo?: string;
  city: string;
  citySlug: string;
  area: string;
  locationFull: string;
  propertyType: PropertyType;
  beds: number;
  sqftMin: number;
  sqftMax?: number;
  launchPriceAed: number;
  launchPriceMaxAed?: number;
  paymentPlan: string;
  paymentPlanCount?: number;
  handover?: string;
  isPremium: boolean;
  imageUrl?: string;
  imageGallery?: string[];
  videoAvailable?: boolean;
  coordinates?: Coordinates;
  projectUnitCount: number;
  whatsapp: string;
  status: string;
}

export interface DeveloperSummary {
  slug: string;
  name: string;
  initials: string;
  projectCount: number;
  unitCount: number;
  cities: string[];
  minPriceAed: number;
  logoUrl?: string;
  description?: string;
  foundedYear?: number;
  numProjectsOnline?: number;
}

export const DEVELOPER_PAGE_SIZE = 12;

export interface DevListEntry {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  establishedSince?: string;
  numProjectsOnline?: number;
  devPageEnabled?: boolean;
}

export type PaymentPlanFilter = "all" | "post-handover" | "multiple";

export interface ProjectFilters {
  query: string;
  city: CitySlug;
  propertyType: PropertyType | "all";
  beds: number | "studio" | "all";
  minPrice: number | null;
  maxPrice: number | null;
  /** Developer slug (slugified developer name) or "all". */
  developer: string;
  paymentPlan: PaymentPlanFilter;
  /** Latest acceptable handover year, or "all". */
  handoverBy: number | "all";
  /** Every selected amenity must be present on the project. */
  amenities: string[];
}