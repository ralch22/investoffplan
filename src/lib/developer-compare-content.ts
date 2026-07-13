/**
 * Pure decision-layer content for developer-vs-developer pages.
 * No I/O / no server-only imports — unit-testable (mirrors compare-content.ts).
 *
 * KPIs are CATALOG-ONLY. Never invent quality, delivery-timeliness, or
 * track-record claims; every bullet is a measurable portfolio fact.
 *
 * Locale-aware (#350): templates from dict.pages.compareDev.decision.
 */

import type { Dict } from "@/i18n";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/config";

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

function decisionDict(dict?: Dict) {
  return (dict ?? getDictionary("en")).pages.compareDev.decision;
}

/**
 * Decision-layer pros for one developer relative to the other — catalog KPIs
 * only (mirrors area-compare `buildPros`).
 */
export function buildDeveloperPros(
  side: DeveloperSide,
  other: DeveloperSide,
  dict?: Dict,
): string[] {
  const t = decisionDict(dict);
  const pros: string[] = [];

  if (side.projectCount > other.projectCount) {
    pros.push(
      interpolate(t.proLargerPortfolio, {
        count: String(side.projectCount),
        otherCount: String(other.projectCount),
      }),
    );
  }
  if (side.unitCount > other.unitCount) {
    pros.push(
      interpolate(t.proMoreUnits, {
        units: side.unitCount.toLocaleString(),
        otherUnits: other.unitCount.toLocaleString(),
      }),
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
      interpolate(t.proLowerEntry, {
        price: money(side.fromPrice),
        otherPrice: money(other.fromPrice),
      }),
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
      interpolate(t.proLowerPpsf, {
        ppsf: side.avgPpsf.toLocaleString(),
        otherPpsf: other.avgPpsf.toLocaleString(),
      }),
    );
  }
  if (side.communities.length > other.communities.length) {
    pros.push(
      interpolate(t.proBroaderGeo, {
        count: String(side.communities.length),
        ledBy: side.communities.slice(0, 3).join(", "),
        otherCount: String(other.communities.length),
      }),
    );
  }
  if (
    side.premiumShare > other.premiumShare &&
    side.premiumShare >= 0.15 &&
    side.premiumShare - other.premiumShare >= 0.05
  ) {
    pros.push(
      interpolate(t.proPremiumShare, {
        pct: String(Math.round(side.premiumShare * 100)),
        otherPct: String(Math.round(other.premiumShare * 100)),
      }),
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
      interpolate(t.proEarlierHandover, {
        year: String(sideEarliest),
        otherYear: String(otherEarliest),
      }),
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
  dict?: Dict,
): { profile: string; reason: string }[] {
  const t = decisionDict(dict);
  const out: { profile: string; reason: string }[] = [];

  if (
    side.fromPrice != null &&
    side.fromPrice > 0 &&
    side.fromPrice <= 1_500_000 &&
    (other.fromPrice == null || side.fromPrice <= other.fromPrice)
  ) {
    const belowClause =
      other.fromPrice != null && other.fromPrice > side.fromPrice
        ? interpolate(t.suitBudgetBelow, {
            otherName: other.name,
            otherPrice: money(other.fromPrice),
          })
        : "";
    out.push({
      profile: t.suitBudgetProfile,
      reason: interpolate(t.suitBudgetReason, {
        price: money(side.fromPrice),
        belowClause,
      }),
    });
  }
  if (side.projectCount >= other.projectCount && side.projectCount >= 10) {
    out.push({
      profile: t.suitDepthProfile,
      reason: interpolate(t.suitDepthReason, {
        count: String(side.projectCount),
        units: side.unitCount.toLocaleString(),
      }),
    });
  }
  if (
    side.communities.length >= 5 &&
    side.communities.length >= other.communities.length
  ) {
    out.push({
      profile: t.suitGeoProfile,
      reason: interpolate(t.suitGeoReason, {
        count: String(side.communities.length),
        ledBy: side.communities.slice(0, 3).join(", "),
      }),
    });
  }
  if (side.premiumShare >= 0.25 && side.premiumShare >= other.premiumShare) {
    out.push({
      profile: t.suitPremiumProfile,
      reason: interpolate(t.suitPremiumReason, {
        pct: String(Math.round(side.premiumShare * 100)),
      }),
    });
  }
  const earliest = side.handoverYears[0];
  const otherEarliest = other.handoverYears[0];
  if (
    earliest != null &&
    (otherEarliest == null || earliest <= otherEarliest) &&
    earliest <= new Date().getFullYear() + 2
  ) {
    const pipelineClause =
      side.handoverYears.length > 1
        ? interpolate(t.suitNearTermPipeline, {
            lastYear: String(side.handoverYears[side.handoverYears.length - 1]),
          })
        : "";
    out.push({
      profile: t.suitNearTermProfile,
      reason: interpolate(t.suitNearTermReason, {
        year: String(earliest),
        pipelineClause,
      }),
    });
  }
  if (
    side.avgPpsf != null &&
    other.avgPpsf != null &&
    side.avgPpsf > 0 &&
    side.avgPpsf < other.avgPpsf
  ) {
    out.push({
      profile: t.suitValueProfile,
      reason: interpolate(t.suitValueReason, {
        ppsf: side.avgPpsf.toLocaleString(),
        otherPpsf: other.avgPpsf.toLocaleString(),
        otherName: other.name,
      }),
    });
  }
  return out.slice(0, 3);
}

/** Data-driven FAQs for the developer pair (rendered + FAQPage JSON-LD). */
export function buildDeveloperFaqs(
  cmp: DeveloperComparison,
  dict?: Dict,
): Array<{ q: string; a: string }> {
  const t = decisionDict(dict);
  const { a, b } = cmp;
  const faqs: Array<{ q: string; a: string }> = [];
  const big = a.projectCount >= b.projectCount ? a : b;
  const small = big === a ? b : a;
  faqs.push({
    q: interpolate(t.faqMoreProjectsQ, { a: a.name, b: b.name }),
    a: interpolate(t.faqMoreProjectsA, {
      big: big.name,
      count: String(big.projectCount),
      units: big.unitCount.toLocaleString(),
      smallCount: String(small.projectCount),
      small: small.name,
    }),
  });
  if (a.fromPrice != null && b.fromPrice != null) {
    const cheap = a.fromPrice <= b.fromPrice ? a : b;
    const dear = cheap === a ? b : a;
    faqs.push({
      q: t.faqLowerEntryQ,
      a: interpolate(t.faqLowerEntryA, {
        cheap: cheap.name,
        price: money(cheap.fromPrice!),
        otherPrice: money(dear.fromPrice!),
        dear: dear.name,
      }),
    });
  }
  const wide = a.communities.length >= b.communities.length ? a : b;
  const narrow = wide === a ? b : a;
  faqs.push({
    q: t.faqMoreCommunitiesQ,
    a: interpolate(t.faqMoreCommunitiesA, {
      wide: wide.name,
      count: String(wide.communities.length),
      ledBy: wide.communities.slice(0, 3).join(", ") || t.ledByNa,
      otherCount: String(narrow.communities.length),
      narrow: narrow.name,
    }),
  });
  if (a.avgPpsf != null && b.avgPpsf != null && a.avgPpsf > 0 && b.avgPpsf > 0) {
    const lower = a.avgPpsf <= b.avgPpsf ? a : b;
    const higher = lower === a ? b : a;
    faqs.push({
      q: t.faqLowerPpsfQ,
      a: interpolate(t.faqLowerPpsfA, {
        lower: lower.name,
        ppsf: lower.avgPpsf!.toLocaleString(),
        otherPpsf: higher.avgPpsf!.toLocaleString(),
        higher: higher.name,
      }),
    });
  }
  if (a.premiumShare !== b.premiumShare) {
    const hi = a.premiumShare >= b.premiumShare ? a : b;
    const lo = hi === a ? b : a;
    faqs.push({
      q: t.faqPremiumQ,
      a: interpolate(t.faqPremiumA, {
        hi: hi.name,
        pct: String(Math.round(hi.premiumShare * 100)),
        otherPct: String(Math.round(lo.premiumShare * 100)),
        lo: lo.name,
      }),
    });
  }
  return faqs;
}
