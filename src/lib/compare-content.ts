import type { AreaComparison, AreaComparisonSide } from "@/lib/area-compare";
import { getSuggestedComparisons } from "@/lib/area-compare";
import { getProjectsByCommunity } from "@/lib/communities";
import { formatPrice } from "@/lib/format";

/**
 * Decision-layer content for community comparison pages (SEO-plan spec):
 * programmatic pros/cons, "who is it for" suitability, and data-driven FAQs —
 * all computed from real DLD aggregates + the off-plan catalog, no copywriting.
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

/** Programmatic pros for one side, relative to the other. */
export function buildPros(
  side: AreaComparisonSide,
  other: AreaComparisonSide,
  extras: SideExtras,
): string[] {
  const pros: string[] = [];
  const s = side.stats;
  const o = other.stats;

  if (s?.grossYieldPct != null && o?.grossYieldPct != null && s.grossYieldPct > o.grossYieldPct) {
    pros.push(`Higher gross rental yield — ${s.grossYieldPct}% vs ${o.grossYieldPct}%`);
  }
  if (s?.medianPpsqft != null && o?.medianPpsqft != null && s.medianPpsqft < o.medianPpsqft) {
    pros.push(
      `Lower median sold AED/sqft (AED ${s.medianPpsqft.toLocaleString()} vs AED ${o.medianPpsqft.toLocaleString()}) — more built space per dirham`,
    );
  }
  if (
    side.area.minPriceAed > 0 &&
    other.area.minPriceAed > 0 &&
    side.area.minPriceAed < other.area.minPriceAed
  ) {
    pros.push(`Lower off-plan entry price — launches from ${money(side.area.minPriceAed)}`);
  }
  if (s?.appreciationPct != null && o?.appreciationPct != null && s.appreciationPct > o.appreciationPct) {
    pros.push(`Stronger 2025 sold-price trend (${s.appreciationPct}% vs ${o.appreciationPct}%)`);
  }
  if (s != null && o != null && s.saleSample > o.saleSample) {
    pros.push(
      `Deeper resale market — ${s.saleSample.toLocaleString()} sales recorded in 2025 vs ${o.saleSample.toLocaleString()} (easier exit)`,
    );
  }
  if (side.area.projectCount > other.area.projectCount) {
    pros.push(
      `More live off-plan supply — ${side.area.projectCount} projects and ${side.area.unitCount.toLocaleString()} unit options`,
    );
  }
  if (extras.familyStockShare >= 0.3) {
    pros.push(
      `Substantial villa/townhouse stock (${Math.round(extras.familyStockShare * 100)}% of unit options) — genuine family inventory`,
    );
  }
  return pros;
}

/** "Who is it for" — buyer-suitability line for one side. */
export function buildSuitability(
  side: AreaComparisonSide,
  other: AreaComparisonSide,
  extras: SideExtras,
): { profile: string; reason: string }[] {
  const out: { profile: string; reason: string }[] = [];
  const s = side.stats;
  const o = other.stats;

  if (s?.grossYieldPct != null && s.grossYieldPct >= 6.5) {
    out.push({
      profile: "Yield investors",
      reason: `${s.grossYieldPct}% gross yield on real 2025 rents and sold prices${
        o?.grossYieldPct != null && s.grossYieldPct > o.grossYieldPct
          ? " — the stronger side of this comparison"
          : ""
      }.`,
    });
  }
  if (side.area.minPriceAed > 0 && side.area.minPriceAed <= 1_000_000) {
    out.push({
      profile: "First-time buyers",
      reason: `Off-plan launches from ${money(side.area.minPriceAed)} keep the entry ticket under AED 1M.`,
    });
  }
  if (extras.familyStockShare >= 0.3) {
    out.push({
      profile: "Families / end-users",
      reason: `${Math.round(extras.familyStockShare * 100)}% of unit options are villas or townhouses.`,
    });
  }
  if (s != null && s.saleSample >= 1_000) {
    out.push({
      profile: "Liquidity-focused investors",
      reason: `${s.saleSample.toLocaleString()} sales in 2025 — a deep market when it's time to exit.`,
    });
  }
  if (
    s?.medianPpsqft != null &&
    o?.medianPpsqft != null &&
    s.medianPpsqft < o.medianPpsqft
  ) {
    out.push({
      profile: "Value hunters",
      reason: `Median sold AED/sqft is ${Math.round(((o.medianPpsqft - s.medianPpsqft) / o.medianPpsqft) * 100)}% below ${other.area.name}.`,
    });
  }
  return out.slice(0, 3);
}

/** Data-driven FAQ (rendered + FAQPage JSON-LD). */
export function buildComparisonFaqs(cmp: AreaComparison): Array<{ q: string; a: string }> {
  const { a, b } = cmp;
  const faqs: Array<{ q: string; a: string }> = [];

  if (a.stats?.grossYieldPct != null && b.stats?.grossYieldPct != null) {
    const hi = a.stats.grossYieldPct >= b.stats.grossYieldPct ? a : b;
    const lo = hi === a ? b : a;
    faqs.push({
      q: `Which has the better rental yield, ${a.area.name} or ${b.area.name}?`,
      a: `${hi.area.name} — ${hi.stats!.grossYieldPct}% gross yield vs ${lo.stats!.grossYieldPct}% in ${lo.area.name}, based on median annual rent ÷ median sold price from Dubai Land Department 2025 transactions.`,
    });
  }
  if (a.stats?.medianPrice != null && b.stats?.medianPrice != null) {
    const cheap = a.stats.medianPrice <= b.stats.medianPrice ? a : b;
    const dear = cheap === a ? b : a;
    faqs.push({
      q: `Is ${a.area.name} or ${b.area.name} cheaper to buy in?`,
      a: `${cheap.area.name} — the 2025 median sold price was ${money(cheap.stats!.medianPrice!)} vs ${money(dear.stats!.medianPrice!)} in ${dear.area.name}. Off-plan launches start from ${money(cheap.area.minPriceAed)} in ${cheap.area.name} and ${money(dear.area.minPriceAed)} in ${dear.area.name}.`,
    });
  }
  if (a.stats != null && b.stats != null) {
    const liq = a.stats.saleSample >= b.stats.saleSample ? a : b;
    const thin = liq === a ? b : a;
    faqs.push({
      q: `Which is easier to resell, ${a.area.name} or ${b.area.name}?`,
      a: `${liq.area.name} recorded ${liq.stats!.saleSample.toLocaleString()} sales in 2025 vs ${thin.stats!.saleSample.toLocaleString()} in ${thin.area.name}, so it has the deeper resale market. Transaction depth is a practical proxy for how quickly you can exit at market price.`,
    });
  }
  const supply = a.area.projectCount >= b.area.projectCount ? a : b;
  const scarce = supply === a ? b : a;
  faqs.push({
    q: `Where is there more off-plan choice right now?`,
    a: `${supply.area.name} — ${supply.area.projectCount} live off-plan projects with ${supply.area.unitCount.toLocaleString()} unit options, vs ${scarce.area.projectCount} projects in ${scarce.area.name}. More supply means more negotiating room but also more future competition at handover.`,
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
