export interface DataGuruTool {
  slug: string;
  title: string;
  description: string;
  href: string;
  pfHref: string;
  /** PF DataGuru feature name for parity tracking */
  pfFeature: string;
}

export const DATAGURU_TOOLS: DataGuruTool[] = [
  {
    slug: "price-map",
    title: "Price Map",
    description:
      "See which communities fit your budget — launch prices by area, bedroom count, and property type.",
    href: "/tools/price-map",
    pfHref: "https://www.propertyfinder.ae/en/area-insights/explore-prices/dubai",
    pfFeature: "Price Map",
  },
  {
    slug: "communities",
    title: "Community Insights",
    description:
      "Explore communities grouped by lifestyle — family-friendly, waterfront, urban, golf, and more.",
    href: "/tools/communities",
    pfHref: "https://www.propertyfinder.ae/en/area-insights/dubai",
    pfFeature: "Community Insights",
  },
  {
    slug: "rent-vs-buy",
    title: "Rent vs Buy Calculator",
    description:
      "Compare monthly payments and long-term costs of renting versus buying off-plan in the UAE.",
    href: "/tools/rent-vs-buy",
    pfHref: "https://www.propertyfinder.ae/en/rent-vs-buy-calculator",
    pfFeature: "Rent vs Buy Calculator",
  },
  {
    slug: "residential",
    title: "Residential Insights",
    description:
      "Launch-price intelligence per project — average prices, price per sqft, and nearby comparisons.",
    href: "/tools/residential",
    pfHref: "https://www.propertyfinder.ae/en/area-insights/dubai/compounds-and-towers",
    pfFeature: "Residential Insights",
  },
  {
    slug: "mortgage",
    title: "Mortgage Calculator",
    description:
      "Model repayments, cash-to-close with DLD fees, and stress-tested affordability — then request pre-approval.",
    href: "/tools/mortgage",
    pfHref: "https://www.propertyfinder.ae/en/mortgages",
    pfFeature: "Mortgage tools",
  },
  {
    slug: "payment",
    title: "Payment Plan Calculator",
    description:
      "Break any payment plan (60/40, 80/20, post-handover) into dirham amounts per phase at your purchase price.",
    href: "/tools/payment",
    pfHref: "https://www.propertyfinder.ae/en/new-projects",
    pfFeature: "Payment plans",
  },
  {
    slug: "new-projects",
    title: "New Projects",
    description:
      "Browse 2,000+ off-plan unit options with brochures, compare, and payment calculators.",
    href: "/projects",
    pfHref: "https://www.propertyfinder.ae/en/new-projects",
    pfFeature: "New Projects",
  },
];

export function getDataGuruTool(slug: string): DataGuruTool | undefined {
  return DATAGURU_TOOLS.find((t) => t.slug === slug);
}