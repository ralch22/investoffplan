/**
 * Pure decision-layer content for developer-vs-developer pages.
 * No I/O / no server-only imports — unit-testable (mirrors compare-content.ts).
 *
 * KPIs are CATALOG-ONLY. Never invent quality, delivery-timeliness, or
 * track-record claims; every bullet is a measurable portfolio fact.
 */

export interface DeveloperSide {
  slug: string;
  name: string;
  logoUrl?: string;
  projectCount: number;
  unitCount: number;
  fromPrice: number | null;
  avgPpsf: number | null;
  communities: string[];
  handoverYears: number[];
  premiumShare: number;
}

export interface DeveloperComparison {
  pairSlug: string;
  a: DeveloperSide;
  b: DeveloperSide;
}

const money = (n: number) => `AED ${Math.round(n).toLocaleString()}`;

/**
 * Decision-layer pros for one developer relative to the other — catalog KPIs
 * only (mirrors area-compare `buildPros`).
 */
export function buildDeveloperPros(
  side: DeveloperSide,
  other: DeveloperSide,
): string[] {
  const pros: string[] = [];

  if (side.projectCount > other.projectCount) {
    pros.push(
      `Larger live off-plan portfolio — ${side.projectCount} projects vs ${other.projectCount}`,
    );
  }
  if (side.unitCount > other.unitCount) {
    pros.push(
      `More unit options on this portal — ${side.unitCount.toLocaleString()} vs ${other.unitCount.toLocaleString()}`,
    );
  }
  if (
    side.fromPrice != null &&
    other.fromPrice != null &&
    side.fromPrice > 0 &&
    other.fromPrice > 0 &&
    side.fromPrice < other.fromPrice
  ) {
    pros.push(
      `Lower entry price — launches from ${money(side.fromPrice)} vs ${money(other.fromPrice)}`,
    );
  }
  if (
    side.avgPpsf != null &&
    other.avgPpsf != null &&
    side.avgPpsf > 0 &&
    other.avgPpsf > 0 &&
    side.avgPpsf < other.avgPpsf
  ) {
    pros.push(
      `Lower average launch AED/sqft — AED ${side.avgPpsf.toLocaleString()} vs AED ${other.avgPpsf.toLocaleString()}`,
    );
  }
  if (side.communities.length > other.communities.length) {
    pros.push(
      `Broader geographic reach — ${side.communities.length} communities (led by ${side.communities.slice(0, 3).join(", ")}) vs ${other.communities.length}`,
    );
  }
  if (
    side.premiumShare > other.premiumShare &&
    side.premiumShare >= 0.15 &&
    side.premiumShare - other.premiumShare >= 0.05
  ) {
    pros.push(
      `Higher share of premium-flagged projects (${Math.round(side.premiumShare * 100)}% vs ${Math.round(other.premiumShare * 100)}%)`,
    );
  }
  const sideEarliest = side.handoverYears[0];
  const otherEarliest = other.handoverYears[0];
  if (
    sideEarliest != null &&
    otherEarliest != null &&
    sideEarliest < otherEarliest
  ) {
    pros.push(
      `Earlier handover pipeline starts in ${sideEarliest} (vs ${otherEarliest})`,
    );
  }
  return pros;
}

/**
 * "Who is it for" suitability lines from catalog positioning only — no quality
 * judgments. Mirrors area-compare `buildSuitability`.
 */
export function buildDeveloperSuitability(
  side: DeveloperSide,
  other: DeveloperSide,
): { profile: string; reason: string }[] {
  const out: { profile: string; reason: string }[] = [];

  if (
    side.fromPrice != null &&
    side.fromPrice > 0 &&
    side.fromPrice <= 1_500_000 &&
    (other.fromPrice == null || side.fromPrice <= other.fromPrice)
  ) {
    out.push({
      profile: "Budget-conscious buyers",
      reason: `Live launches start from ${money(side.fromPrice)}${
        other.fromPrice != null && other.fromPrice > side.fromPrice
          ? ` — below ${other.name}'s ${money(other.fromPrice)} floor`
          : ""
      }.`,
    });
  }
  if (side.projectCount >= other.projectCount && side.projectCount >= 10) {
    out.push({
      profile: "Buyers who want depth of choice",
      reason: `${side.projectCount} live off-plan projects and ${side.unitCount.toLocaleString()} unit options on this portal.`,
    });
  }
  if (
    side.communities.length >= 5 &&
    side.communities.length >= other.communities.length
  ) {
    out.push({
      profile: "Geographic diversifiers",
      reason: `Active across ${side.communities.length} communities (led by ${side.communities.slice(0, 3).join(", ")}).`,
    });
  }
  if (side.premiumShare >= 0.25 && side.premiumShare >= other.premiumShare) {
    out.push({
      profile: "Premium-positioned inventory seekers",
      reason: `${Math.round(side.premiumShare * 100)}% of listed projects are premium-flagged in the catalog (positioning flag only — not a quality score).`,
    });
  }
  const earliest = side.handoverYears[0];
  const otherEarliest = other.handoverYears[0];
  if (
    earliest != null &&
    (otherEarliest == null || earliest <= otherEarliest) &&
    earliest <= new Date().getFullYear() + 2
  ) {
    out.push({
      profile: "Near-term handover buyers",
      reason: `Earliest listed handover year is ${earliest}${
        side.handoverYears.length > 1
          ? ` (pipeline through ${side.handoverYears[side.handoverYears.length - 1]})`
          : ""
      }.`,
    });
  }
  if (
    side.avgPpsf != null &&
    other.avgPpsf != null &&
    side.avgPpsf > 0 &&
    side.avgPpsf < other.avgPpsf
  ) {
    out.push({
      profile: "Value-per-sqft hunters",
      reason: `Average launch AED/sqft is AED ${side.avgPpsf.toLocaleString()} vs AED ${other.avgPpsf.toLocaleString()} for ${other.name}.`,
    });
  }
  return out.slice(0, 3);
}

/** Data-driven FAQs for the developer pair (rendered + FAQPage JSON-LD). */
export function buildDeveloperFaqs(
  cmp: DeveloperComparison,
): Array<{ q: string; a: string }> {
  const { a, b } = cmp;
  const faqs: Array<{ q: string; a: string }> = [];
  const big = a.projectCount >= b.projectCount ? a : b;
  const small = big === a ? b : a;
  faqs.push({
    q: `Who has more off-plan projects, ${a.name} or ${b.name}?`,
    a: `${big.name} — ${big.projectCount} live off-plan projects with ${big.unitCount.toLocaleString()} unit options on this portal, vs ${small.projectCount} projects from ${small.name}.`,
  });
  if (a.fromPrice != null && b.fromPrice != null) {
    const cheap = a.fromPrice <= b.fromPrice ? a : b;
    const dear = cheap === a ? b : a;
    faqs.push({
      q: `Which developer has the lower entry price?`,
      a: `${cheap.name} — launches from ${money(cheap.fromPrice!)}, vs ${money(dear.fromPrice!)} for ${dear.name}.`,
    });
  }
  const wide = a.communities.length >= b.communities.length ? a : b;
  const narrow = wide === a ? b : a;
  faqs.push({
    q: `Which developer covers more communities?`,
    a: `${wide.name} builds across ${wide.communities.length} communities (led by ${wide.communities.slice(0, 3).join(", ") || "n/a"}), vs ${narrow.communities.length} for ${narrow.name}.`,
  });
  if (a.avgPpsf != null && b.avgPpsf != null && a.avgPpsf > 0 && b.avgPpsf > 0) {
    const lower = a.avgPpsf <= b.avgPpsf ? a : b;
    const higher = lower === a ? b : a;
    faqs.push({
      q: `Who has the lower average launch price per sqft?`,
      a: `${lower.name} averages AED ${lower.avgPpsf!.toLocaleString()}/sqft across catalog units, vs AED ${higher.avgPpsf!.toLocaleString()}/sqft for ${higher.name}. These are launch list prices, not DLD sold prices.`,
    });
  }
  if (a.premiumShare !== b.premiumShare) {
    const hi = a.premiumShare >= b.premiumShare ? a : b;
    const lo = hi === a ? b : a;
    faqs.push({
      q: `Which developer has more premium-flagged projects?`,
      a: `${hi.name} — ${Math.round(hi.premiumShare * 100)}% of listed projects are premium-flagged vs ${Math.round(lo.premiumShare * 100)}% for ${lo.name}. Premium is a catalog positioning flag, not a quality or delivery rating.`,
    });
  }
  return faqs;
}
