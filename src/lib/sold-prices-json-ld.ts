import { getSiteUrl } from "@/lib/site-url";
import { getRecentSalesMeta } from "@/lib/dld-recent-sales";

/**
 * Dataset schema for a /sold-prices/[community] page. PF's transaction pages
 * emit ZERO JSON-LD — this is the technical-SEO wedge for "sold prices"
 * queries. Anonymized aggregates only; DLD attributed as source organization.
 */
export function buildSoldPricesDatasetJsonLd(opts: {
  communityName: string;
  communitySlug: string;
  rowCount: number;
  months: string[]; // observed YYYY-MM values, sorted asc
}) {
  const base = getSiteUrl();
  const meta = getRecentSalesMeta();
  const first = opts.months[0];
  const last = opts.months[opts.months.length - 1];
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Sold property prices in ${opts.communityName}, Dubai — DLD transactions`,
    description: `Recent anonymized residential sale transactions in ${opts.communityName} from Dubai Land Department open data: price, AED per sqft, bedrooms, size band and off-plan/ready registration type. ${opts.rowCount} most recent transactions, month-level dates.`,
    url: `${base}/sold-prices/${opts.communitySlug}`,
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "invest off-plan",
      url: base,
    },
    sourceOrganization: {
      "@type": "GovernmentOrganization",
      name: "Dubai Land Department",
    },
    temporalCoverage: first && last ? `${first}/${last}` : undefined,
    dateModified: meta.builtAt,
    variableMeasured: [
      "sale price (AED)",
      "price per sqft (AED)",
      "bedrooms",
      "size band (sqm)",
      "registration type (off-plan/ready)",
    ],
    license: "Derived from Dubai Land Department open data; anonymized aggregates.",
  };
}
