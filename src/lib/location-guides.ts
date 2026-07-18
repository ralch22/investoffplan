import { getCatalogApi } from "@/lib/catalog";
import { getCommunities, communitySlugFor, type CommunitySummary } from "@/lib/communities";
import { getAreaStats } from "@/lib/dld-area-stats";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

/**
 * Topical "location guide" pillar (SEO plan): community-ranking roundups
 * computed entirely from real DLD aggregates + the off-plan catalog — no
 * copywriting, no fabricated lifestyle claims. Each guide ranks communities on
 * one decision axis and links into their /communities pages, forming the
 * internal-linking backbone the plan calls for.
 */

export interface CommunityMetrics {
  slug: string;
  name: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  /** Share of units that are villas/townhouses/penthouses, 0..1. */
  familyShare: number;
  grossYieldPct: number | null;
  medianPpsqft: number | null;
  medianPrice: number | null;
  saleSample: number;
  dldCovered: boolean;
}

const FAMILY_TYPES = new Set(["villa", "townhouse", "penthouse", "duplex"]);

let cache: CommunityMetrics[] | null = null;

/** One catalog pass → per-community metrics, merged with DLD stats. */
export async function getCommunityMetrics(): Promise<CommunityMetrics[]> {
  if (cache) return cache;
  const [communities, api] = await Promise.all([getCommunities(), getCatalogApi()]);

  const family = new Map<string, number>();
  const total = new Map<string, number>();
  let totalUnits = 0;
  for (const p of api.projects) {
    const slug = communitySlugFor(p.area);
    for (const u of p.units) {
      totalUnits++;
      total.set(slug, (total.get(slug) ?? 0) + 1);
      if (FAMILY_TYPES.has(u.propertyType)) family.set(slug, (family.get(slug) ?? 0) + 1);
    }
  }

  // Degraded-source guard. getCatalogApi() can fall back to catalog-lite.json
  // (every project there carries units: []) when D1 blips on a cold isolate.
  // Computing familyShare=0 from that slice and caching it forever is how
  // /locations/best-communities-for-families notFound()'d during an ISR
  // revalidation and poisoned the shared incremental cache with a 404 for a
  // page the build had rendered perfectly. A catalog with zero units across
  // 1,700+ projects is not a market fact — it is a degraded read, and the
  // only honest response is to throw: a failed revalidation keeps serving
  // the last good page, while notFound() replaces it.
  if (api.projects.length > 0 && totalUnits === 0) {
    throw new Error(
      "[location-guides] catalog has projects but zero units — degraded source (lite fallback?); refusing to compute metrics",
    );
  }

  cache = communities.map((c: CommunitySummary) => {
    const stats = getAreaStats(c.name);
    const tot = total.get(c.slug) ?? 0;
    return {
      slug: c.slug,
      name: c.name,
      cityLabel: c.cityLabel,
      projectCount: c.projectCount,
      unitCount: c.unitCount,
      minPriceAed: c.minPriceAed,
      familyShare: tot > 0 ? (family.get(c.slug) ?? 0) / tot : 0,
      grossYieldPct: stats?.grossYieldPct ?? null,
      medianPpsqft: stats?.medianPpsqft ?? null,
      medianPrice: stats?.medianPrice ?? null,
      saleSample: stats?.saleSample ?? 0,
      dldCovered: stats != null,
    };
  });
  return cache;
}

export interface RankedCommunity {
  metrics: CommunityMetrics;
  /** Pre-formatted headline metric for this guide (e.g. "6.9%"). */
  valueLabel: string;
  /** One-line, data-only rationale. */
  rationale: string;
}

export interface GuideAr {
  label?: string;
  h1?: string;
  intro?: string;
  metricLabel?: string;
  methodology?: string;
}

export interface LocationGuide {
  slug: string;
  /** Nav/card label. */
  label: string;
  title: string;
  h1: string;
  intro: string;
  metricLabel: string;
  methodology: string;
  ar?: GuideAr;
  /** Rank communities; `locale` localizes secondary rationale lines (#315). */
  rank: (all: CommunityMetrics[], locale: Locale) => RankedCommunity[];
}

/** Return locale-specific text, falling back to EN. */
export function guideText(
  guide: LocationGuide,
  field: keyof GuideAr,
  locale: string,
): string {
  if (locale === "ar") return guide.ar?.[field] ?? guide[field];
  return guide[field];
}

const MIN_PROJECTS = 3;
const MIN_SALES = 40;

const money = (n: number, locale: Locale = "en") =>
  `AED ${Math.round(n).toLocaleString(locale === "ar" ? "ar-AE" : "en-US")}`;

const num = (n: number, locale: Locale) =>
  n.toLocaleString(locale === "ar" ? "ar-AE" : "en-US");

function rationaleDict(locale: Locale) {
  return getDictionary(locale).pages.locations.rationale;
}

export const LOCATION_GUIDES: LocationGuide[] = [
  {
    slug: "best-communities-for-families",
    label: "Best for families",
    title: "Best Communities for Families in Dubai (Off-Plan)",
    h1: "Best communities for families",
    intro:
      "Family buyers want space, not just a balcony. These Dubai communities have the highest share of villas, townhouses and larger homes across their live off-plan launches — ranked from our catalog, so the list reflects what you can actually buy today.",
    metricLabel: "Family-home stock",
    methodology:
      "Ranked by the share of a community's off-plan unit options that are villas, townhouses, penthouses or duplexes, among communities with at least 3 live projects.",
    ar: {
      label: "الأفضل للعائلات",
      h1: "أفضل مجتمعات للعائلات",
      intro:
        "المشترون العائليون يبحثون عن المساحة، لا مجرد شرفة. تمتلك هذه المجتمعات في دبي أعلى نسبة فلل ومنازل كبيرة من إطلاقات العقارات على الخارطة المتاحة — مرتّبة من كتالوجنا لتعكس ما يمكنك شراؤه اليوم.",
      metricLabel: "مخزون المنازل العائلية",
      methodology:
        "مرتّبة بحسب نسبة وحدات المجتمع على الخارطة من فلل ومنازل وبنتهاوسات ودوبلكس، من بين المجتمعات ذات 3 مشاريع نشطة على الأقل.",
    },
    rank: (all, locale) => {
      const t = rationaleDict(locale);
      return all
        // Title promises Dubai — don't rank Abu Dhabi/Sharjah communities here.
        .filter((c) => c.cityLabel === "Dubai" && c.projectCount >= MIN_PROJECTS && c.familyShare > 0)
        .sort((a, b) => b.familyShare - a.familyShare)
        .slice(0, 12)
        .map((c) => {
          const pct = Math.round(c.familyShare * 100);
          return {
            metrics: c,
            valueLabel: `${pct}%`,
            rationale: interpolate(t.familyStock, {
              pct,
              units: num(c.unitCount, locale),
              projects: c.projectCount,
            }),
          };
        });
    },
  },
  {
    slug: "highest-rental-yield-communities",
    label: "Highest yields",
    title: "Highest Rental-Yield Communities in Dubai (2025 DLD Data)",
    h1: "Highest rental-yield communities",
    intro:
      "Gross rental yield is the clearest income signal for an investor. These communities post the strongest yields on real Dubai Land Department 2025 transactions — median annual rent divided by median sold price, not asking prices.",
    metricLabel: "Gross yield",
    methodology:
      "Ranked by gross rental yield (median annual rent ÷ median sold price) from Dubai Land Department 2025 data, among communities with at least 40 recorded sales.",
    ar: {
      label: "أعلى عوائد",
      h1: "مجتمعات بأعلى عائد إيجاري",
      intro:
        "العائد الإيجاري الإجمالي هو أوضح مؤشر للدخل للمستثمر. تُسجّل هذه المجتمعات أعلى العوائد استنادًا إلى بيانات دائرة الأراضي والأملاك الفعلية لعام 2025 — الإيجار السنوي الوسيط مقسومًا على سعر البيع الوسيط، لا الأسعار المطلوبة.",
      metricLabel: "العائد الإيجاري الإجمالي",
      methodology:
        "مرتّبة بحسب العائد الإيجاري الإجمالي (الإيجار السنوي الوسيط ÷ سعر البيع الوسيط) من بيانات دائرة الأراضي لعام 2025، من بين المجتمعات ذات 40 صفقة مسجّلة على الأقل.",
    },
    rank: (all, locale) => {
      const t = rationaleDict(locale);
      return all
        .filter((c) => c.grossYieldPct != null && c.saleSample >= MIN_SALES)
        .sort((a, b) => (b.grossYieldPct ?? 0) - (a.grossYieldPct ?? 0))
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: `${c.grossYieldPct}%`,
          rationale: interpolate(t.grossYield, {
            yield: c.grossYieldPct ?? 0,
            price: c.medianPrice ? money(c.medianPrice, locale) : "—",
            sales: num(c.saleSample, locale),
          }),
        }));
    },
  },
  {
    slug: "most-affordable-communities",
    label: "Most affordable",
    title: "Most Affordable Communities to Buy Off-Plan in Dubai",
    h1: "Most affordable communities to buy off-plan",
    intro:
      "Entry price is where most plans start. These communities have the lowest off-plan launch prices in our catalog — a practical shortlist if you're buying your first unit or keeping the ticket under budget.",
    metricLabel: "Launch price from",
    methodology:
      "Ranked by the lowest off-plan launch price in each community, among communities with at least 3 live projects.",
    ar: {
      label: "الأكثر تناسبًا",
      h1: "أكثر مجتمعات دبي تناسبًا للميزانية",
      intro:
        "سعر الدخول هو نقطة انطلاق معظم الخطط. تمتلك هذه المجتمعات أدنى أسعار إطلاق على الخارطة في كتالوجنا — قائمة عملية لمن يشتري أول وحدة له أو يحرص على البقاء ضمن الميزانية.",
      metricLabel: "سعر الإطلاق من",
      methodology:
        "مرتّبة بحسب أدنى سعر إطلاق على الخارطة في كل مجتمع، من بين المجتمعات ذات 3 مشاريع نشطة على الأقل.",
    },
    rank: (all, locale) => {
      const t = rationaleDict(locale);
      return all
        // Title promises Dubai — don't rank Abu Dhabi/Sharjah communities here.
        .filter((c) => c.cityLabel === "Dubai" && c.projectCount >= MIN_PROJECTS && c.minPriceAed > 0)
        .sort((a, b) => a.minPriceAed - b.minPriceAed)
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: money(c.minPriceAed, locale),
          rationale: interpolate(t.affordable, {
            price: money(c.minPriceAed, locale),
            projects: c.projectCount,
            units: num(c.unitCount, locale),
          }),
        }));
    },
  },
  {
    slug: "best-value-communities",
    label: "Best value / sqft",
    title: "Best-Value Communities by Price Per Sqft (Dubai)",
    h1: "Best value on price per sqft",
    intro:
      "Two homes at the same price can offer very different space. These communities have the lowest median sold price per square foot on 2025 DLD data — where your dirham buys the most built area.",
    metricLabel: "Median sold AED/sqft",
    methodology:
      "Ranked by the lowest median sold price per sqft from Dubai Land Department 2025 data, among communities with at least 40 recorded sales.",
    ar: {
      label: "أفضل قيمة/قدم²",
      h1: "أفضل قيمة مقابل سعر القدم المربعة",
      intro:
        "منزلان بالسعر ذاته قد يقدّمان مساحتين مختلفتين جدًا. تمتلك هذه المجتمعات أدنى وسيط سعر للقدم المربعة المباعة وفق بيانات دائرة الأراضي لعام 2025 — حيث يشتري درهمك أكبر مساحة مبنية.",
      metricLabel: "وسيط البيع درهم/قدم²",
      methodology:
        "مرتّبة بحسب أدنى وسيط سعر للقدم المربعة المباعة من بيانات دائرة الأراضي لعام 2025، من بين المجتمعات ذات 40 صفقة مسجّلة على الأقل.",
    },
    rank: (all, locale) => {
      const t = rationaleDict(locale);
      return all
        .filter((c) => c.medianPpsqft != null && c.saleSample >= MIN_SALES)
        .sort((a, b) => (a.medianPpsqft ?? 0) - (b.medianPpsqft ?? 0))
        .slice(0, 12)
        .map((c) => {
          const ppsf = num(c.medianPpsqft!, locale);
          return {
            metrics: c,
            valueLabel: `AED ${ppsf}`,
            rationale: interpolate(t.valueSqft, {
              ppsf,
              sales: num(c.saleSample, locale),
            }),
          };
        });
    },
  },
  {
    slug: "most-liquid-communities",
    label: "Most liquid",
    title: "Most Liquid Communities for Resale in Dubai (2025)",
    h1: "Most liquid communities for resale",
    intro:
      "Liquidity is how easily you can exit at market price. These communities recorded the most sales in 2025 — the deepest resale markets in Dubai, where buyers are plentiful when you decide to sell.",
    metricLabel: "2025 sales",
    methodology:
      "Ranked by the number of recorded sales in Dubai Land Department 2025 data — a practical proxy for resale liquidity.",
    ar: {
      label: "الأكثر سيولة",
      h1: "أكثر مجتمعات دبي سيولةً للإعادة",
      intro:
        "السيولة هي مدى سهولة خروجك بسعر السوق. سجّلت هذه المجتمعات أكبر عدد من المبيعات في 2025 — أعمق أسواق إعادة البيع في دبي، حيث يتوفّر المشترون حين تقرر البيع.",
      metricLabel: "مبيعات 2025",
      methodology:
        "مرتّبة بحسب عدد المبيعات المسجّلة في بيانات دائرة الأراضي لعام 2025 — مقياس عملي لسيولة إعادة البيع.",
    },
    rank: (all, locale) => {
      const t = rationaleDict(locale);
      return all
        .filter((c) => c.saleSample >= MIN_SALES)
        .sort((a, b) => b.saleSample - a.saleSample)
        .slice(0, 12)
        .map((c) => {
          const sales = num(c.saleSample, locale);
          return {
            metrics: c,
            valueLabel: sales,
            rationale:
              c.grossYieldPct != null
                ? interpolate(t.liquidWithYield, {
                    sales,
                    yield: c.grossYieldPct,
                  })
                : interpolate(t.liquid, { sales }),
          };
        });
    },
  },
];

export function getLocationGuide(slug: string): LocationGuide | undefined {
  return LOCATION_GUIDES.find((g) => g.slug === slug);
}

export async function buildGuideRanking(
  slug: string,
  locale: Locale = "en",
): Promise<{
  guide: LocationGuide;
  ranked: RankedCommunity[];
} | null> {
  const guide = getLocationGuide(slug);
  if (!guide) return null;
  const all = await getCommunityMetrics();
  const ranked = guide.rank(all, locale);
  if (ranked.length === 0) return null;
  return { guide, ranked };
}
