import type { Metadata } from "next";
import { getCommunity } from "@/lib/communities";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
// Metadata builds a localized Arabic title per community with AR canonical +
// hreflang.
export { default, generateStaticParams } from "@/app/(en)/communities/[slug]/page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
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
