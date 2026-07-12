import type { Metadata } from "next";
import { getCommunity } from "@/lib/communities";
import { getSiteUrl } from "@/lib/site-url";
import CommunityDetailPage, { generateStaticParams } from "@/app/(en)/communities/[slug]/page";

// AR mirror — chrome + RTL from the AR layout's LocaleProvider.
// Passes locale="ar" so all UI strings render in Arabic.
export { generateStaticParams };

export default function ArCommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CommunityDetailPage params={params} locale="ar" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  const path = `/communities/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const community = await getCommunity(slug);
  if (!community) return { title: "المجتمع غير موجود", alternates };
  return {
    title: `عقارات على الخارطة في ${community.name}، ${community.cityLabel}`,
    description: `${community.projectCount} مشروعاً على الخارطة للبيع في ${community.name}، ${community.cityLabel} — الأسعار ومخططات الطوابق وخطط السداد وبيانات دائرة الأراضي والأملاك.`,
    alternates,
  };
}
