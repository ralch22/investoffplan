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
    item.catalog?.locationFull,
    item.project.area,
    item.project.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /beach|waterfront|island|marina|palm|creek|coast|shore|sea/.test(haystack);
}

export function valueScore(item: FlatUnit): number {
  const ppsf = unitPricePerSqft(item);
  if (!ppsf) return item.unit.launchPriceAed;
  return ppsf;
}