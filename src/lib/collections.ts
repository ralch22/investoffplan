import type { CitySlug, CollectionFilter } from "@/lib/types";
import type { FlatUnit } from "@/lib/catalog-core";
import { isBrandedResidence } from "@/lib/investment-metrics";

export interface CollectionPage {
  slug: string;
  title: string;
  h1: string;
  /** SEO meta description (<=160 chars). */
  description: string;
  intro: string[];
  /** Built-in collection filter, when one exists. */
  collection?: CollectionFilter;
  /** Custom predicate for collections without a built-in filter. */
  predicate?: (item: FlatUnit) => boolean;
  /** City preset for emirate landing pages. */
  city?: CitySlug;
  /** Query string for the "refine on the SERP" CTA. */
  serpQuery: string;
}

export const COLLECTION_PAGES: CollectionPage[] = [
  {
    slug: "waterfront",
    title: "Waterfront Off-Plan Projects in the UAE",
    h1: "Waterfront living",
    description:
      "Off-plan apartments and villas on the UAE's beaches, islands, marinas, and creeks — launch prices, payment plans, and brochures.",
    intro: [
      "Waterfront addresses hold a structural advantage in the UAE market: shoreline is finite, master developers meter out new beachfront phases slowly, and resale demand concentrates on anything with direct water access. That is why launch buyers watch Dubai Islands, Emaar Beachfront, Dubai Creek Harbour, Mina Rashid, and Ras Al Khaimah's Al Marjan Island so closely.",
      "This collection tracks every unit in our catalog with a beach, island, marina, creek, or coastal address — compared on launch price, AED per square foot, handover date, and payment plan, with brochures where developers publish them.",
    ],
    collection: "waterfront",
    serpQuery: "collection=waterfront",
  },
  {
    slug: "luxury",
    title: "Luxury & Premium Off-Plan Launches",
    h1: "Premium launches",
    description:
      "Premium-tier off-plan launches across Dubai and the UAE — flagship towers, villa enclaves, and signature addresses with payment plans.",
    intro: [
      "Premium listings are where developers put their flagship product: signature architecture, larger floor plates, branded amenities, and the community's best plots. They also tend to carry the strongest developer marketing support through construction, which matters for resale before handover.",
      "Every unit here carries premium placement in our Property Finder-parity catalog. Compare AED-per-sqft against the community average before you commit — flagship pricing is sometimes justified, sometimes not, and the spread is visible in the data.",
    ],
    collection: "premium",
    serpQuery: "collection=premium",
  },
  {
    slug: "branded",
    title: "Branded Residences Off-Plan in the UAE",
    h1: "Branded residences",
    description:
      "Off-plan branded residences — hotel, fashion, and automotive brand partnerships across Dubai and the UAE, with launch pricing.",
    intro: [
      "Branded residences pair a developer's tower with a global hospitality, fashion, or automotive name — and the brand premium is real: managed services, hotel-grade amenities, and typically stronger rental performance from guests who book the name, not the neighbourhood.",
      "This collection surfaces projects in our catalog whose names carry recognised residence brands — from hotel operators to couture houses. Expect a pricing premium over unbranded comparables in the same community; the payment plans below let you judge whether the brand carries its weight.",
    ],
    predicate: isBrandedResidence,
    serpQuery: "q=residences",
  },
  {
    slug: "under-2m",
    title: "Off-Plan Properties Under AED 2M",
    h1: "Under AED 2M",
    description:
      "Off-plan units under AED 2 million — Golden Visa-eligible entry points with payment plans across Dubai and the northern emirates.",
    intro: [
      "AED 2 million is the most consequential threshold in UAE property: it is the qualifying line for the 10-year Golden Visa. Units priced just below it are the market's most competitive segment — and off-plan payment plans mean you can secure a visa-qualifying asset with a fraction of the price paid upfront.",
      "Everything in this collection launches under AED 2M. Sort by AED-per-sqft to find genuine value, and note handover dates — visa eligibility timing depends on registration, so confirm the current rules with DLD before structuring a purchase around it.",
    ],
    collection: "under-2m",
    serpQuery: "collection=under-2m",
  },
  {
    slug: "studios",
    title: "Off-Plan Studios in the UAE",
    h1: "Studio apartments",
    description:
      "Off-plan studio apartments across the UAE — the lowest entry prices and strongest gross yields in the launch market.",
    intro: [
      "Studios are the yield play of the off-plan market: the lowest absolute entry price, the smallest gap between launch and rental value, and the deepest tenant pool in commuter communities like JVC, Arjan, and Dubai South. Investors buying purely on numbers usually start here.",
      "This collection isolates every studio in the catalog. Watch the size column — post-normalization our data shows genuine square footage, so you can separate efficient 400-sqft layouts from cramped ones at the same price.",
    ],
    collection: "studio",
    serpQuery: "collection=studio",
  },
  {
    slug: "dubai",
    title: "Off-Plan Projects in Dubai",
    h1: "Dubai off-plan",
    description:
      "Every off-plan launch we track in Dubai — unit-level pricing, payment plans, handovers, and brochures across the city's communities.",
    intro: [
      "Dubai is the centre of gravity of the UAE off-plan market — the deepest developer bench, the widest payment-plan innovation, and the communities global buyers actually recognise. From Emaar's waterfront districts to value corridors like JVC and Dubailand, launch inventory spans every budget.",
      "This page tracks our full Dubai catalog at unit level. Use the SERP filters to narrow by community, developer, or handover year — or start from the price map to see where your budget lands across the city.",
    ],
    city: "dubai",
    serpQuery: "city=dubai",
  },
  {
    slug: "abu-dhabi",
    title: "Off-Plan Projects in Abu Dhabi",
    h1: "Abu Dhabi off-plan",
    description:
      "Off-plan launches across Abu Dhabi — Yas Island, Saadiyat, Al Reem, and Zayed City — with launch prices and payment plans.",
    intro: [
      "Abu Dhabi's off-plan market runs on islands: Yas for leisure-led living, Saadiyat for culture and beachfront, Al Reem for skyline apartments minutes from the CBD. Pricing is consistently below comparable Dubai waterfront, and Aldar's payment plans are among the most buyer-friendly in the country.",
      "Browse every Abu Dhabi launch we track below, or jump to the SERP to filter by island, budget, and handover date.",
    ],
    city: "abu-dhabi",
    serpQuery: "city=abu-dhabi",
  },
  {
    slug: "ras-al-khaimah",
    title: "Off-Plan Projects in Ras Al Khaimah",
    h1: "Ras Al Khaimah off-plan",
    description:
      "Off-plan launches in Ras Al Khaimah — Al Marjan Island's casino-resort corridor and the UAE's fastest-appreciating launch market.",
    intro: [
      "Ras Al Khaimah is the UAE's momentum story. The Wynn resort under construction on Al Marjan Island has pulled international developers north, and launch pricing on the island now rivals established Dubai waterfront on a per-sqft basis — a repricing that happened in barely three years.",
      "This collection tracks every RAK launch in our catalog. Weigh the premium carefully: beachfront addresses closest to the resort corridor carry the boldest pricing, while inland launches still offer northern-emirates value.",
    ],
    city: "rak",
    serpQuery: "city=rak",
  },
  {
    slug: "sharjah",
    title: "Off-Plan Projects in Sharjah",
    h1: "Sharjah off-plan",
    description:
      "Off-plan launches in Sharjah — Al Mamsha, Aljada, and family-first communities at the UAE's most accessible price points.",
    intro: [
      "Sharjah's off-plan market is built for end-users: walkable master communities like Al Mamsha and Aljada, family-sized layouts, and entry prices well below Dubai for buyers who commute across the border. Recent reforms opened ownership in many zones to all nationalities, widening the buyer pool.",
      "Every Sharjah launch we track is below — compare payment plans and handover dates, and check the per-sqft spread against Dubailand-corridor alternatives on the Dubai side.",
    ],
    city: "sharjah",
    serpQuery: "city=sharjah",
  },
];

export function getCollectionPage(slug: string): CollectionPage | undefined {
  return COLLECTION_PAGES.find((page) => page.slug === slug);
}
