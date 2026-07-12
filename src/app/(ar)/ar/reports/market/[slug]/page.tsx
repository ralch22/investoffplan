import type { Metadata } from "next";
import MarketReportPage, {
  generateStaticParams as enGenerateStaticParams,
} from "@/app/(en)/reports/market/[slug]/page";
import { getCommunity } from "@/lib/communities";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/config";

// AR mirror of printable per-community market reports (#245).
// Keeps Arabic hub deep-links under /ar/reports/market/[slug].
export const generateStaticParams = enGenerateStaticParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  const dict = getDictionary("ar");
  if (!community) return { title: "التقرير غير موجود" };
  return {
    title: interpolate(dict.reports.reportTitle, { name: community.name }),
    robots: { index: false, follow: false },
  };
}

export default function ArMarketReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <MarketReportPage params={params} locale="ar" />;
}
