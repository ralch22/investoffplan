import type { Metadata } from "next";
import { getGuide } from "@/lib/figma-copy";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default, generateStaticParams } from "@/app/(en)/guides/[slug]/page";

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
