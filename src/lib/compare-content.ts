import type { AreaComparison, AreaComparisonSide } from "@/lib/area-compare";
import { getSuggestedComparisons } from "@/lib/area-compare";
import { getProjectsByCommunity } from "@/lib/communities";
import { formatPrice } from "@/lib/format";
import type { Dict } from "@/i18n";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/config";

/**
 * Decision-layer content for community comparison pages (SEO-plan spec):
 * programmatic pros/cons, "who is it for" suitability, and data-driven FAQs —
 * all computed from real DLD aggregates + the off-plan catalog, no copywriting.
 *
 * Locale-aware (#357): templates from dict.pages.compare.decision.
 */

export interface SideExtras {
  /** Share of units that are villas/townhouses, 0..1. */
  familyStockShare: number;
}

async function sideExtras(slug: string): Promise<SideExtras> {
  const projects = await getProjectsByCommunity(slug);
  let family = 0;
  let total = 0;
  for (const p of projects) {
    for (const u of p.units) {
      total += 1;
      if (u.propertyType === "villa" || u.propertyType === "townhouse") family += 1;
    }
  }
  return { familyStockShare: total > 0 ? family / total : 0 };
}

export async function getComparisonExtras(
  cmp: AreaComparison,
): Promise<{ a: SideExtras; b: SideExtras }> {
  const [a, b] = await Promise.all([
    sideExtras(cmp.a.area.slug),
    sideExtras(cmp.b.area.slug),
  ]);
  return { a, b };
}

const money = (n: number) => formatPrice(Math.round(n), "AED");

function decisionDict(dict?: Dict) {
  return (dict ?? getDictionary("en")).pages.compare.decision;
}

/** Programmatic pros for one side, relative to the other. */
export function buildPros(
  side: AreaComparisonSide,
  other: AreaComparisonSide,
  extras: SideExtras,
  dict?: Dict,
): string[] {
  const t = decisionDict(dict);
  const pros: string[] = [];
  const s = side.stats;
  const o = other.stats;

  if (s?.grossYieldPct != null && o?.grossYieldPct != null && s.grossYieldPct > o.grossYieldPct) {
    pros.push(
      interpolate(t.proHigherYield, {
        yield: String(s.grossYieldPct),
        otherYield: String(o.grossYieldPct),
      }),
    );
  }
  if (s?.medianPpsqft != null && o?.medianPpsqft != null && s.medianPpsqft < o.medianPpsqft) {
    pros.push(
      interpolate(t.proLowerMedianPsf, {
        ppsf: s.medianPpsqft.toLocaleString(),
        otherPpsf: o.medianPpsqft.toLocaleString(),
      }),
    );
  }
  if (
    side.area.minPriceAed > 0 &&
    other.area.minPriceAed > 0 &&
    side.area.minPriceAed < other.area.minPriceAed
  ) {
    pros.push(
      interpolate(t.proLowerEntry, {
        price: money(side.area.minPriceAed),
      }),
    );
  }
  if (s?.appreciationPct != null && o?.appreciationPct != null && s.appreciationPct > o.appreciationPct) {
    pros.push(
      interpolate(t.proStrongerTrend, {
        pct: String(s.appreciationPct),
        otherPct: String(o.appreciationPct),
      }),
    );
  }
  if (s != null && o != null && s.saleSample > o.saleSample) {
    pros.push(
      interpolate(t.proDeeperResale, {
        sales: s.saleSample.toLocaleString(),
        otherSales: o.saleSample.toLocaleString(),
      }),
    );
  }
  if (side.area.projectCount > other.area.projectCount) {
    pros.push(
      interpolate(t.proMoreSupply, {
        count: String(side.area.projectCount),
        units: side.area.unitCount.toLocaleString(),
      }),
    );
  }
  if (extras.familyStockShare >= 0.3) {
    pros.push(
      interpolate(t.proFamilyStock, {
        pct: String(Math.round(extras.familyStockShare * 100)),
      }),
    );
  }
  return pros;
}

/** "Who is it for" — buyer-suitability line for one side. */
export function buildSuitability(
  side: AreaComparisonSide,
  other: AreaComparisonSide,
  extras: SideExtras,
  dict?: Dict,
): { profile: string; reason: string }[] {
  const t = decisionDict(dict);
  const out: { profile: string; reason: string }[] = [];
  const s = side.stats;
  const o = other.stats;

  if (s?.grossYieldPct != null && s.grossYieldPct >= 6.5) {
    const strongerClause =
      o?.grossYieldPct != null && s.grossYieldPct > o.grossYieldPct
        ? t.suitYieldStronger
        : "";
    out.push({
      profile: t.suitYieldProfile,
      reason: interpolate(t.suitYieldReason, {
        yield: String(s.grossYieldPct),
        strongerClause,
      }),
    });
  }
  if (side.area.minPriceAed > 0 && side.area.minPriceAed <= 1_000_000) {
    out.push({
      profile: t.suitFirstTimeProfile,
      reason: interpolate(t.suitFirstTimeReason, {
        price: money(side.area.minPriceAed),
      }),
    });
  }
  if (extras.familyStockShare >= 0.3) {
    out.push({
      profile: t.suitFamilyProfile,
      reason: interpolate(t.suitFamilyReason, {
        pct: String(Math.round(extras.familyStockShare * 100)),
      }),
    });
  }
  if (s != null && s.saleSample >= 1_000) {
    out.push({
      profile: t.suitLiquidityProfile,
      reason: interpolate(t.suitLiquidityReason, {
        sales: s.saleSample.toLocaleString(),
      }),
    });
  }
  if (
    s?.medianPpsqft != null &&
    o?.medianPpsqft != null &&
    s.medianPpsqft < o.medianPpsqft
  ) {
    out.push({
      profile: t.suitValueProfile,
      reason: interpolate(t.suitValueReason, {
        pct: String(
          Math.round(((o.medianPpsqft - s.medianPpsqft) / o.medianPpsqft) * 100),
        ),
        otherName: other.area.name,
      }),
    });
  }
  return out.slice(0, 3);
}

/** Data-driven FAQ (rendered + FAQPage JSON-LD). */
export function buildComparisonFaqs(
  cmp: AreaComparison,
  dict?: Dict,
): Array<{ q: string; a: string }> {
  const t = decisionDict(dict);
  const { a, b } = cmp;
  const faqs: Array<{ q: string; a: string }> = [];

  if (a.stats?.grossYieldPct != null && b.stats?.grossYieldPct != null) {
    const hi = a.stats.grossYieldPct >= b.stats.grossYieldPct ? a : b;
    const lo = hi === a ? b : a;
    faqs.push({
      q: interpolate(t.faqBetterYieldQ, {
        a: a.area.name,
        b: b.area.name,
      }),
      a: interpolate(t.faqBetterYieldA, {
        hi: hi.area.name,
        yield: String(hi.stats!.grossYieldPct),
        otherYield: String(lo.stats!.grossYieldPct),
        lo: lo.area.name,
      }),
    });
  }
  if (a.stats?.medianPrice != null && b.stats?.medianPrice != null) {
    const cheap = a.stats.medianPrice <= b.stats.medianPrice ? a : b;
    const dear = cheap === a ? b : a;
    faqs.push({
      q: interpolate(t.faqCheaperQ, {
        a: a.area.name,
        b: b.area.name,
      }),
      a: interpolate(t.faqCheaperA, {
        cheap: cheap.area.name,
        price: money(cheap.stats!.medianPrice!),
        otherPrice: money(dear.stats!.medianPrice!),
        dear: dear.area.name,
        cheapLaunch: money(cheap.area.minPriceAed),
        dearLaunch: money(dear.area.minPriceAed),
      }),
    });
  }
  if (a.stats != null && b.stats != null) {
    const liq = a.stats.saleSample >= b.stats.saleSample ? a : b;
    const thin = liq === a ? b : a;
    faqs.push({
      q: interpolate(t.faqResellQ, {
        a: a.area.name,
        b: b.area.name,
      }),
      a: interpolate(t.faqResellA, {
        liq: liq.area.name,
        sales: liq.stats!.saleSample.toLocaleString(),
        otherSales: thin.stats!.saleSample.toLocaleString(),
        thin: thin.area.name,
      }),
    });
  }
  const supply = a.area.projectCount >= b.area.projectCount ? a : b;
  const scarce = supply === a ? b : a;
  faqs.push({
    q: t.faqMoreChoiceQ,
    a: interpolate(t.faqMoreChoiceA, {
      supply: supply.area.name,
      count: String(supply.area.projectCount),
      units: supply.area.unitCount.toLocaleString(),
      scarceCount: String(scarce.area.projectCount),
      scarce: scarce.area.name,
    }),
  });
  return faqs;
}

/** Related comparisons for the internal-linking mesh. */
export async function getRelatedComparisons(
  cmp: AreaComparison,
  limit = 6,
): Promise<{ pairSlug: string; label: string }[]> {
  const [fromA, fromB] = await Promise.all([
    getSuggestedComparisons(cmp.a.area.slug, limit),
    getSuggestedComparisons(cmp.b.area.slug, limit),
  ]);
  const seen = new Set<string>([cmp.pairSlug]);
  const out: { pairSlug: string; label: string }[] = [];
  const interleaved = [fromA, fromB];
  for (let i = 0; out.length < limit && (interleaved[0].length > i || interleaved[1].length > i); i++) {
    for (const [idx, list] of interleaved.entries()) {
      const item = list[i];
      if (!item || seen.has(item.pairSlug)) continue;
      seen.add(item.pairSlug);
      const base = idx === 0 ? cmp.a.area.name : cmp.b.area.name;
      out.push({ pairSlug: item.pairSlug, label: `${base} vs ${item.otherName}` });
      if (out.length >= limit) break;
    }
  }
  return out;
}
