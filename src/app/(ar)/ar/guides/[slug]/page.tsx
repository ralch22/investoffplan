import type { Metadata } from "next";
import { getGuide } from "@/lib/figma-copy";
import { getSiteUrl } from "@/lib/site-url";
import GuideDetailPage, { generateStaticParams } from "@/app/(en)/guides/[slug]/page";

export { generateStaticParams };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  const path = `/guides/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const guide = getGuide(slug);
  if (!guide) return { title: "الدليل غير موجود", alternates };
  return {
    title: `${guide.title} | دليل الشراء على الخارطة`,
    description: `دليل المشتري للعقارات على الخارطة في الإمارات: ${guide.description}`,
    alternates,
  };
}

export default async function ArGuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <GuideDetailPage params={params} locale="ar" />;
}
