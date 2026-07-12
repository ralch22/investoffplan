import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { CompareHubPageContent } from "@/app/(en)/compare/page";

/** Match EN hub: force-static, no on-request ISR (CF 1102 / #221). */
export const dynamic = "force-static";
export const revalidate = false;

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
