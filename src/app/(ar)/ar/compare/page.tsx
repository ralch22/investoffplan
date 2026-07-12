import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { CompareHubPageContent } from "@/app/(en)/compare/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    title: "قارن مشاريع العقارات على الخارطة",
    description:
      "قارن حتى ثلاث وحدات على الخارطة جنباً إلى جنب — الأسعار، مواعيد التسليم، خطط السداد، والبروشورات.",
    alternates: { canonical: `${base}/ar/compare`, languages: { "x-default": `${base}/compare`, en: `${base}/compare`, ar: `${base}/ar/compare` } },
  };
})();

interface PageProps {
  searchParams: Promise<{ units?: string }>;
}

export default async function ArCompareHubPage({ searchParams }: PageProps) {
  return <CompareHubPageContent locale="ar" searchParams={searchParams} />;
}
