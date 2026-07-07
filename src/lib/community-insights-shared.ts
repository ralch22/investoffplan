import type { LifestyleSlug } from "./community-lifestyles";

export interface CommunityInsightArea {
  slug: string;
  name: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  lifestyles: LifestyleSlug[];
}