import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketReportPage } from "@/components/market-report/market-report-page";
import { getMarketReportData } from "@/lib/market-report-data";
import {
  MARKET_REPORT_EDITIONS,
  getEdition,
} from "@/lib/market-report-editions";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary } from "@/i18n";

// All valid editions are known at build time — unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MARKET_REPORT_EDITIONS.map((e) => ({ edition: e.slug }));
}

interface PageProps {
  params: Promise<{ edition: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { edition: slug } = await params;
  const edition = getEdition(slug);
  if (!edition) notFound();

  const { year } = await getMarketReportData();
  const base = getSiteUrl();
  const url = `${base}/market-report/${slug}`;
  const dict = getDictionary("en");
  const t = dict.marketReport;
  const title = `${t.title} ${edition.label}`;
  const description = `The UAE off-plan market in ${edition.label}: median prices, top rental yields, ${year} appreciation, developer activity and handover pipeline — from official DLD data.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "x-default": url,
        en: url,
        ar: `${base}/ar/market-report/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: `UAE Off-Plan Property Market Report ${edition.label}`,
      description,
      publishedTime: edition.publishedAt,
    },
  };
}

export default async function MarketReportEditionPage({ params }: PageProps) {
  const { edition: slug } = await params;
  const edition = getEdition(slug);
  if (!edition) notFound();

  return <MarketReportPage locale="en" edition={edition} />;
}
