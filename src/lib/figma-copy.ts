import { interpolate, type Locale } from "@/i18n/config";

export const DEVELOPER_BLURBS: Record<string, string> = {
  "emaar-properties":
    "Step-by-step guide to purchasing property in Dubai. From finding the home to closing the deal.",
  "damac-properties":
    "Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to moving in.",
  "meraas-holding":
    "Step-by-step guide for both tenants and landlords when rental contracts are ending.",
  "sobha-realty":
    "Step-by-step guide to buying the best home for your family in Dubai's premium communities.",
  "nakheel":
    "Step-by-step guide to purchasing property in Dubai. From finding the home to closing the deal.",
  "binghatti-developers":
    "Step-by-step guide to selling your property in Dubai. From listing your property to a sale.",
};

export const AREA_TAGLINES: Record<string, string> = {
  "dubai-creek-harbour": "Waterfront lifestyle in the heart of the city.",
  "business-bay": "Central business district with skyline views.",
  "dubai-hills-estate": "Luxury living in a green oasis.",
  "dubai-maritime-city": "Maritime-inspired living on the coast.",
  "downtown-dubai": "The heart of Dubai's vibrant city life.",
  "palm-jumeirah": "Iconic island living with beachfront access.",
};

export const GUIDE_CARDS = [
  {
    slug: "why-invest-off-plan-dubai",
    title: "Why Invest in Off-Plan Dubai",
    description:
      "Launch pricing, payment-plan leverage, and capital-growth dynamics — why buying before completion can outperform ready property.",
    href: "/guides/why-invest-off-plan-dubai",
  },
  {
    slug: "understanding-payment-plans",
    title: "Understanding Payment Plans",
    description:
      "Decode 60/40, 80/20, and post-handover structures — what you pay at booking, during construction, and after keys.",
    href: "/guides/understanding-payment-plans",
  },
  {
    slug: "roi-capital-appreciation",
    title: "ROI & Capital Appreciation",
    description:
      "How price-per-sqft, handover dates, and payment plans affect your return profile.",
    href: "/guides/roi-capital-appreciation",
  },
  {
    slug: "foreign-investor-guide",
    title: "Foreign Investor Guide",
    description:
      "Everything international buyers need to know about UAE off-plan purchases.",
    href: "/guides/foreign-investor-guide",
  },
  {
    slug: "upcoming-projects",
    title: "Upcoming Projects to Watch",
    description:
      "Curated launches across Dubai, Abu Dhabi, and the wider UAE market.",
    href: "/projects",
  },
  {
    slug: "compare-units",
    title: "Compare Units Side-by-Side",
    description:
      "Evaluate up to three units on price, handover, brochures, and amenities.",
    href: "/compare",
  },
] as const;

export const GUIDE_REASONS: Record<string, Array<{ title: string; body: string }>> = {
  "why-invest-off-plan-dubai": [
    {
      title: "Lower Initial Costs and Flexible Payment Plans",
      body: "Off-plan purchases spread capital across booking, construction, and handover milestones instead of requiring full upfront payment.",
    },
    {
      title: "Potential for Capital Appreciation",
      body: "Buying before completion can capture price growth as the project advances and the surrounding district matures.",
    },
    {
      title: "High Rental Yields & Tax Benefits",
      body: "UAE property ownership structures can offer attractive yield profiles for investors targeting long-term income.",
    },
    {
      title: "New Property with Modern Amenities",
      body: "Latest launches typically include contemporary fit-outs, smart-home features, and resort-style facilities.",
    },
    {
      title: "First Choice of Prime Locations and Units",
      body: "Early buyers secure preferred floors, views, and layouts before the most desirable inventory sells out.",
    },
    {
      title: "Strong & Growing Real Estate Market",
      body: "Dubai continues to attract global capital through infrastructure investment and sustained launch activity.",
    },
    {
      title: "Robust Buyer Protection",
      body: "Escrow and developer regulations help safeguard buyer funds during the construction cycle.",
    },
    {
      title: "Strategic Locations",
      body: "Master-planned corridors such as Creek, Marina, and Hills Estate remain core demand drivers.",
    },
    {
      title: "Potential for Beating Inflation",
      body: "Hard-asset exposure in a growing market can complement diversified investment portfolios.",
    },
  ],
};

export function getGuide(slug: string) {
  return GUIDE_CARDS.find((g) => g.slug === slug) ?? null;
}

export const NEWS_ARTICLES = [
  {
    title: "Why Dubai South is a Hotspot for Off-Plan Investments?",
    excerpt:
      "Dubai South continues to attract investors with competitive entry prices and strong infrastructure growth.",
    featured: true,
  },
  {
    title: "Luxury Living, Investment, and Life on Palm Jebel Ali",
    excerpt:
      "The next chapter of Palm development is reshaping waterfront off-plan demand.",
  },
  {
    title: "Buying Off-Plan Property in Dubai Made Easy",
    excerpt:
      "A practical walkthrough of brochures, payment plans, and handover timelines.",
  },
  {
    title: "Record Numbers For Off-Plan Property in Dubai",
    excerpt:
      "Transaction volumes and launch activity remain elevated across prime corridors.",
  },
  {
    title: "Dubai Off-Plan Property Prices 2026",
    excerpt:
      "What average AED/sqft trends mean for buyers comparing launches today.",
  },
] as const;

export function developerBlurb(slug: string): string {
  return (
    DEVELOPER_BLURBS[slug] ??
    "Step-by-step guide to purchasing off-plan property in Dubai. From choosing a project to handover."
  );
}

/**
 * Community card / PDP living-area tagline.
 * EN keeps hand-crafted `AREA_TAGLINES` where present; AR has no AR map yet
 * so always uses the localized `exploreTemplate` (avoids EN "Explore off-plan…"
 * on `/ar/communities*` and AR PDP living-in-area).
 */
export function areaTagline(
  slug: string,
  name: string,
  opts?: { locale?: Locale; exploreTemplate?: string },
): string {
  const locale = opts?.locale ?? "en";
  const explore =
    opts?.exploreTemplate ?? "Explore off-plan projects in {name}.";
  if (locale === "ar") {
    return interpolate(explore, { name });
  }
  return AREA_TAGLINES[slug] ?? interpolate(explore, { name });
}