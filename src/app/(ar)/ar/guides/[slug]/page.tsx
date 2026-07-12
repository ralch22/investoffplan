import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import GuideDetailPage, {
  generateStaticParams,
  guideChrome,
} from "@/app/(en)/guides/[slug]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  const path = `/guides/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: {
      "x-default": `${base}${path}`,
      en: `${base}${path}`,
      ar: `${base}/ar${path}`,
    },
  };
  const chrome = guideChrome("ar", slug);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!chrome) notFound();
  return {
    title: `${chrome.title} | دليل الشراء على الخارطة`,
    description: chrome.description,
    alternates,
  };
}

export default async function ArGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <GuideDetailPage params={params} locale="ar" />;
}
