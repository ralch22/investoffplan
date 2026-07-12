import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { MapPageContent } from "@/app/(en)/map/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    title: "خريطة المشاريع",
    description:
      "استكشف مشاريع الإمارات على الخارطة قيد الإنشاء مع الأسعار ومواعيد التسليم وروابط الكتيبات.",
    alternates: {
      canonical: `${base}/ar/map`,
      languages: { "x-default": `${base}/map`, en: `${base}/map`, ar: `${base}/ar/map` },
    },
  };
})();

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function ArMapPage({ searchParams }: PageProps) {
  return <MapPageContent locale="ar" searchParams={searchParams} />;
}
