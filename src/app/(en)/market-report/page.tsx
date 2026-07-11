import type { Metadata } from "next";
import { MarketReportPage } from "@/components/market-report/market-report-page";
import { getMarketReportData } from "@/lib/market-report-data";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Public, INDEXABLE flagship market-intelligence page (NO noindex). Distinct
 * from /reports/market/[slug] (noindex print/gated per-community exports). The
 * page is a server component; ISR (hourly) is inherited from the (en) layout.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { year } = await getMarketReportData();
  const base = getSiteUrl();
  const url = `${base}/market-report`;
  const description = `The UAE off-plan market in ${year}: median prices, top rental yields, 2025 appreciation, developer activity and handover pipeline — from official DLD data.`;
  return {
    // Layout template appends " | invest off-plan" → the full canonical title.
    title: `UAE Off-Plan Property Market Report ${year} — Prices, Yields & Trends`,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, ar: `${base}/ar/market-report` },
    },
    openGraph: {
      type: "article",
      url,
      title: `UAE Off-Plan Property Market Report ${year}`,
      description,
    },
  };
}

export default function Page() {
  return <MarketReportPage locale="en" />;
}
