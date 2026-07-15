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
  const url = `${base}/ar/market-report/${slug}`;
  const dict = getDictionary("ar");
  const t = dict.marketReport;
  const title = `${t.title} ${edition.label}`;
  const description = `سوق العقارات على الخارطة في الإمارات ${edition.label}: الأسعار الوسيطة، أعلى العوائد الإيجارية، ارتفاع ${year} — من بيانات دائرة الأراضي والأملاك.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${base}/market-report/${slug}`,
        en: `${base}/market-report/${slug}`,
        ar: url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: edition.publishedAt,
    },
  };
}

export default async function ArMarketReportEditionPage({ params }: PageProps) {
  const { edition: slug } = await params;
  const edition = getEdition(slug);
  if (!edition) notFound();

  return <MarketReportPage locale="ar" edition={edition} />;
}
