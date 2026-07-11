import type { Metadata } from "next";
import { getDeveloper } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default, generateStaticParams } from "@/app/(en)/developers/[slug]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  const path = `/developers/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: { en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const developer = await getDeveloper(slug);
  if (!developer) return { title: "المطوّر غير موجود", alternates };
  return {
    title: `مشاريع ${developer.name} على الخارطة في الإمارات`,
    description: `تصفّح ${developer.projectCount} مشروعاً على الخارطة من ${developer.name} في الإمارات مع أسعار الإطلاق وخطط السداد والبروشورات.`,
    alternates,
  };
}
