import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SoldPricesCommunityPage, {
  generateStaticParams,
} from "@/app/(en)/sold-prices/[community]/page";
import { getCommunity } from "@/lib/communities";
import { getRecentSales } from "@/lib/dld-recent-sales";
import { getSiteUrl } from "@/lib/site-url";

// AR mirror — chrome + RTL from the AR layout's LocaleProvider.
export { generateStaticParams };
export const dynamicParams = false;

export default function ArSoldPricesCommunityPage({
  params,
}: {
  params: Promise<{ community: string }>;
}) {
  return <SoldPricesCommunityPage params={params} locale="ar" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ community: string }>;
}): Promise<Metadata> {
  const { community: slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();
  const rows = getRecentSales(community.name) ?? [];
  const base = getSiteUrl();
  return {
    title: `أسعار البيع في ${community.name} — معاملات دائرة الأراضي`,
    description: `أحدث أسعار البيع في ${community.name}: ${rows.length} معاملة سكنية مجهولة الهوية من دائرة الأراضي والأملاك في دبي.`.slice(0, 158),
    alternates: {
      canonical: `${base}/ar/sold-prices/${slug}`,
      languages: {
        "x-default": `${base}/sold-prices/${slug}`,
        en: `${base}/sold-prices/${slug}`,
        ar: `${base}/ar/sold-prices/${slug}`,
      },
    },
    robots: rows.length >= 8 ? undefined : { index: false, follow: true },
  };
}
