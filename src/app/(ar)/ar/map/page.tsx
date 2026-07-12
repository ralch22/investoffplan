import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN map page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/map/page";

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
