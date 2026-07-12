import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getCommunity } from "@/lib/communities";
import { interpolate } from "@/i18n/config";
import { ar } from "@/i18n/dictionaries/ar";
import MarketReportSlugPage, {
  generateStaticParams,
} from "@/app/(en)/reports/market/[slug]/page";

// AR mirror of the noindex print/gated per-community report. Body stays the EN
// utility surface (numbers-first); chrome/RTL come from the AR layout. Without
// this route, /ar/market-report deep links 404'd or bounced to EN (#245).
export { generateStaticParams };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  const path = `/reports/market/${slug}`;
  if (!community) {
    return {
      ...arMeta({ path }),
      title: "التقرير غير موجود",
      robots: { index: false, follow: false },
    };
  }
  return {
    ...arMeta({ path }),
    title: interpolate(ar.reports.reportTitle, { name: community.name }),
    robots: { index: false, follow: false },
  };
}

export default function ArMarketReportSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <MarketReportSlugPage params={params} />;
}
