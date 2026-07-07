export interface AreaPricePoint {
  slug: string;
  name: string;
  city: string;
  cityLabel: string;
  lat: number;
  lng: number;
  avgPriceAed: number;
  minPriceAed: number;
  maxPriceAed: number;
  avgPpsf: number | null;
  unitCount: number;
  projectCount: number;
}

export const PRICE_TIER_COLORS = {
  low: "#22c55e",
  mid: "#eab308",
  high: "#d92c20",
} as const;

export function priceTier(
  price: number,
  min: number,
  max: number,
): "low" | "mid" | "high" {
  if (max === min) return "mid";
  const ratio = (price - min) / (max - min);
  if (ratio < 0.33) return "low";
  if (ratio > 0.66) return "high";
  return "mid";
}