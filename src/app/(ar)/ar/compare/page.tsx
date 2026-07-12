import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { CompareHubPageContent } from "@/app/(en)/compare/page";

/** Match EN hub ISR — AR re-exports the same heavy content path. */
export const revalidate = 3600;

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    title: "قارن مشاريع العقارات على الخارطة",
    description:
      "قارن حتى ثلاث وحدات على الخارطة جنباً إلى جنب — الأسعار، مواعيد التسليم، خطط السداد، والبروشورات.",
    alternates: {
      canonical: `${base}/ar/compare`,
      languages: {
        "x-default": `${base}/compare`,
        en: `${base}/compare`,
        ar: `${base}/ar/compare`,
      },
    },
  };
})();

export default async function ArCompareHubPage() {
  return <CompareHubPageContent locale="ar" />;
}
