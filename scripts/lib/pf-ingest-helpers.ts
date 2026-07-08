export function formatPaymentPlanFromPhases(
  plans?: Array<{
    phases?: Array<{ label: string; value: number }>;
    title?: string;
  }>,
): { label: string; count?: number } {
  if (!plans?.length) return { label: "" };
  const p = plans[0];
  const phases = p.phases ?? [];
  const down = phases.find((x) => x.label === "down_payment")?.value ?? 0;
  const during =
    phases.find((x) => x.label === "during_construction")?.value ?? 0;
  const handover = phases.find((x) => x.label === "handover")?.value ?? 0;
  const after = phases.find((x) => x.label === "after_handover")?.value ?? 0;
  const label = `${down}/${during}/${handover}${after ? `/${after}` : ""}`;
  return plans.length > 1
    ? { label: `${plans.length} Payment Plans`, count: plans.length }
    : { label: `Payment Plan: ${label}` };
}

export function formatHandover(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const q = Math.ceil((d.getUTCMonth() + 1) / 3);
  return `Q${q} ${d.getUTCFullYear()}`;
}

export function parseCity(fullName: string): {
  city: string;
  citySlug: string;
  area: string;
} {
  const parts = fullName.split(",").map((s) => s.trim());
  const city = parts[0] || "UAE";
  const citySlug = city
    .toLowerCase()
    .replace(/ras al khaimah/i, "rak")
    .replace(/abu dhabi/i, "abu-dhabi")
    .replace(/umm al quwain/i, "umm-al-quwain")
    .replace(/al ain/i, "al-ain")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return { city, citySlug, area: parts.slice(1).join(", ") || city };
}

export function projectSlugFromPf(slug: string): string {
  const seg = slug.split("/").pop() || slug;
  return seg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const SQFT_PER_SQM = 10.7639;

/**
 * PF's unit-level payload mixes sqm-scale and sqft-scale values in the same
 * `area` field (PF renders both with a "sqft" label — upstream data bug).
 * Score both interpretations against a per-beds plausible size band and
 * AED-per-sqft sanity, and convert only when the sqm reading wins.
 */
function plausibleSqftBand(beds: number): [number, number] {
  switch (beds) {
    case 0:
      return [200, 1300];
    case 1:
      return [350, 1900];
    case 2:
      return [550, 3200];
    case 3:
      return [800, 5500];
    case 4:
      return [1100, 10000];
    case 5:
      return [1400, 16000];
    case 6:
      return [1700, 22000];
    default:
      return [2000, 32000];
  }
}

const PPSF_MIN = 300;
const PPSF_MAX = 12000;

export interface NormalizedSize {
  sqftMin: number;
  sqftMax?: number;
  converted: boolean;
  suspect: boolean;
}

export function normalizeUnitSize(opts: {
  beds: number;
  sqftMin: number;
  sqftMax?: number;
  priceAed?: number;
}): NormalizedSize {
  const { beds, sqftMin, sqftMax, priceAed } = opts;
  if (!sqftMin || sqftMin <= 0) {
    return { sqftMin, sqftMax, converted: false, suspect: false };
  }
  const [lo, hi] = plausibleSqftBand(beds);
  const score = (v: number) => {
    let s = 0;
    if (v >= lo && v <= hi) s += 2;
    if (priceAed && priceAed > 0) {
      const ppsf = priceAed / v;
      if (ppsf >= PPSF_MIN && ppsf <= PPSF_MAX) s += 1;
    }
    return s;
  };
  const asSqftScore = score(sqftMin);
  const convertedMin = Math.round(sqftMin * SQFT_PER_SQM);
  const asSqmScore = score(convertedMin);
  if (asSqmScore > asSqftScore) {
    return {
      sqftMin: convertedMin,
      sqftMax:
        sqftMax && sqftMax > 0 ? Math.round(sqftMax * SQFT_PER_SQM) : sqftMax,
      converted: true,
      suspect: asSqmScore === 0,
    };
  }
  return { sqftMin, sqftMax, converted: false, suspect: asSqftScore === 0 };
}

export function mapStockStatus(
  stockAvailability?: string,
  salesPhase?: string,
): "off-plan" | "under-construction" | "ready" | "sold-out" {
  const value = `${stockAvailability ?? ""} ${salesPhase ?? ""}`.toLowerCase();
  if (value.includes("sold")) return "sold-out";
  if (value.includes("resale")) return "sold-out";
  if (value.includes("construction")) return "under-construction";
  if (value.includes("ready")) return "ready";
  return "off-plan";
}