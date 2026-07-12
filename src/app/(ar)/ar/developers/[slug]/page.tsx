import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDeveloper } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

import DeveloperDetailPage, { generateStaticParams } from "@/app/(en)/developers/[slug]/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider;
// the locale prop localizes links, headings, and labels.
export { generateStaticParams };
export const dynamicParams = false;

export default function ArabicDeveloperDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <DeveloperDetailPage {...props} locale="ar" />;
}

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
    languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const developer = await getDeveloper(slug);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!developer) notFound();
  return {
    title: `مشاريع ${developer.name} على الخارطة في الإمارات`,
    description: `تصفّح ${developer.projectCount} مشروعاً على الخارطة من ${developer.name} في الإمارات مع أسعار الإطلاق وخطط السداد والبروشورات.`,
    alternates,
  };
}
