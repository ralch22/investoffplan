import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/compare/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    title: "قارن مشاريع العقارات على الخارطة",
    description:
      "قارن حتى ثلاث وحدات على الخارطة جنباً إلى جنب — الأسعار، مواعيد التسليم، خطط السداد، والبروشورات.",
    alternates: { canonical: `${base}/ar/compare`, languages: { en: `${base}/compare`, ar: `${base}/ar/compare` } },
  };
})();
