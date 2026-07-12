import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  articleDescription,
  articleTitle,
  getNewsArticle,
} from "@/content/articles";
import { getSiteUrl } from "@/lib/site-url";
import NewsArticlePage, { generateStaticParams } from "@/app/(en)/news/[slug]/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider;
// the locale prop localizes internal links, dates, and AR title/description (#298).
export { generateStaticParams };
export const dynamicParams = false;

export default function ArabicNewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <NewsArticlePage params={params} locale="ar" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  const path = `/news/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const article = getNewsArticle(slug);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!article) notFound();
  const title = articleTitle(article, "ar");
  const description = articleDescription(article, "ar");
  return {
    title: `${title} | أخبار العقارات على الخارطة`,
    description: `آخر أخبار سوق العقارات على الخارطة في الإمارات: ${description}`,
    alternates,
  };
}
