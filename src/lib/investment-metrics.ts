import type { FlatUnit } from "./projects";
import { resolveBrochureUrl } from "./brochure";

export function pricePerSqft(priceAed: number, sqft: number): number | null {
  if (!sqft || sqft <= 0) return null;
  return Math.round(priceAed / sqft);
}

export function unitPricePerSqft(item: FlatUnit): number | null {
  return pricePerSqft(item.unit.launchPriceAed, item.unit.sqftMin);
}

export function handoverMonths(handover?: string): number | null {
  if (!handover) return null;
  const match = handover.match(/Q(\d)\s+(\d{4})/);
  if (!match) return null;
  const quarter = Number(match[1]);
  const year = Number(match[2]);
  const handoverDate = new Date(year, (quarter - 1) * 3, 1);
  const now = new Date();
  const months =
    (handoverDate.getFullYear() - now.getFullYear()) * 12 +
    (handoverDate.getMonth() - now.getMonth());
  return Math.max(0, months);
}

export function parsePaymentPlan(plan: string): {
  downPaymentPct: number;
  duringPct: number;
  handoverPct: number;
  afterPct: number;
} | null {
  // Only parse plans that ARE numeric splits ("20/40/40", "5 / 30 / 65").
  // Junk labels like "2 Payment Plans" previously matched their "2" and the
  // calculator rendered a fabricated 2% down payment (102 live projects).
  if (!/^\d+(\s*\/\s*\d+)+$/.test(plan.trim())) return null;
  const nums = plan.match(/\d+/g)?.map(Number);
  if (!nums?.length) return null;
  const [down = 0, during = 0, handover = 0, after = 0] = nums;
  return {
    downPaymentPct: down,
    duringPct: during,
    handoverPct: handover,
    afterPct: after,
  };
}

export function downPaymentAed(priceAed: number, plan: string): number | null {
  const parsed = parsePaymentPlan(plan);
  if (!parsed) return null;
  return Math.round((priceAed * parsed.downPaymentPct) / 100);
}

export function hasBrochure(item: FlatUnit): boolean {
  return Boolean(resolveBrochureUrl(item.project));
}

export function isWaterfront(item: FlatUnit): boolean {
  const haystack = [
    item.catalog?.locationFull ?? item.project.locationFull,
    item.project.area,
    item.project.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /beach|waterfront|island|marina|palm|creek|coast|shore|sea/.test(haystack);
}

const BRANDED_KEYWORDS =
  /armani|bugatti|mercedes|bentley|cavalli|missoni|elie saab|versace|fendi|baccarat|trump|address|vida|rove|st\.? regis|ritz|four seasons|w residences|jumeirah living|paramount|de grisogono|dorchester|mandarin oriental|six senses|banyan tree|nobu|kempinski|sls|mama shelter|hyde|delano|rixos|waldorf/i;

/** Branded residences — hotel/fashion/auto-brand names in the project title. */
export function isBrandedResidence(item: FlatUnit): boolean {
  return BRANDED_KEYWORDS.test(item.project.name);
}

export function valueScore(item: FlatUnit): number {
  const ppsf = unitPricePerSqft(item);
  if (!ppsf) return item.unit.launchPriceAed;
  return ppsf;
}