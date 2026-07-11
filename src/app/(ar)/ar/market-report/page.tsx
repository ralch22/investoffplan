import type { Metadata } from "next";
import { MarketReportPage } from "@/components/market-report/market-report-page";
import { getMarketReportData } from "@/lib/market-report-data";
import { getSiteUrl } from "@/lib/site-url";

// AR mirror of the public, INDEXABLE market report. Chrome + RTL come from the
// AR layout's LocaleProvider; the shared component translates via locale="ar".
export async function generateMetadata(): Promise<Metadata> {
  const { year } = await getMarketReportData();
  const base = getSiteUrl();
  const url = `${base}/ar/market-report`;
  const description = `سوق العقارات على الخارطة في الإمارات ${year}: الأسعار الوسيطة، أعلى العوائد الإيجارية، ارتفاع 2025، نشاط المطوّرين وخط التسليم — من بيانات دائرة الأراضي والأملاك الرسمية.`;
  return {
    title: `تقرير سوق العقارات على الخارطة في الإمارات ${year} — الأسعار والعوائد والاتجاهات`,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${base}/market-report`, ar: url },
    },
    openGraph: {
      type: "article",
      url,
      title: `تقرير سوق العقارات على الخارطة في الإمارات ${year}`,
      description,
    },
  };
}

export default function Page() {
  return <MarketReportPage locale="ar" />;
}
