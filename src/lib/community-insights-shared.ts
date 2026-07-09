import type { LifestyleSlug } from "./community-lifestyles";

export interface CommunityInsightArea {
  slug: string;
  name: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  lifestyles: LifestyleSlug[];
  /** Real DLD 2025 gross rental yield %, when the community has sold+rent data. */
  grossYieldPct?: number | null;
  /** Real DLD 2025 median sold AED/sqft. */
  medianSoldPpsqft?: number | null;
}