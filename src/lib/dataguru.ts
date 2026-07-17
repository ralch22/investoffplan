export interface DataGuruTool {
  slug: string;
  title: string;
  description: string;
  href: string;
}

export const DATAGURU_TOOLS: DataGuruTool[] = [
  {
    slug: "price-map",
    title: "Price Map",
    description:
      "See which communities fit your budget — launch prices by area, bedroom count, and property type.",
    href: "/tools/price-map",
  },
  {
    slug: "communities",
    title: "Community Insights",
    description:
      "Explore communities grouped by lifestyle — family-friendly, waterfront, urban, golf, and more.",
    href: "/tools/communities",
  },
  {
    slug: "rent-vs-buy",
    title: "Rent vs Buy Calculator",
    description:
      "Compare monthly payments and long-term costs of renting versus buying off-plan in the UAE.",
    href: "/tools/rent-vs-buy",
  },
  {
    slug: "residential",
    title: "Residential Insights",
    description:
      "Launch-price intelligence per project — average prices, price per sqft, and nearby comparisons.",
    href: "/tools/residential",
  },
  {
    slug: "mortgage",
    title: "Mortgage Calculator",
    description:
      "Model repayments, cash-to-close with DLD fees, and stress-tested affordability — then request pre-approval.",
    href: "/tools/mortgage",
  },
  {
    slug: "payment",
    title: "Payment Plan Calculator",
    description:
      "Break any payment plan (60/40, 80/20, post-handover) into dirham amounts per phase at your purchase price.",
    href: "/tools/payment",
  },
  {
    slug: "new-projects",
    title: "New Projects",
    description:
      "Browse 2,000+ off-plan unit options with brochures, compare, and payment calculators.",
    href: "/projects",
  },
  {
    slug: "roi",
    title: "ROI & Yield Estimator",
    description:
      "Estimate off-plan rental yield, capital appreciation, and total return — prefilled with 2025 DLD market data and shareable via link.",
    href: "/tools/roi",
  },
];

export function getDataGuruTool(slug: string): DataGuruTool | undefined {
  return DATAGURU_TOOLS.find((t) => t.slug === slug);
}