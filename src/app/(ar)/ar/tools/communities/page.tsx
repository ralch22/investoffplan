import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { CommunityInsightsPageContent } from "@/app/(en)/tools/communities/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/communities`,
      languages: { "x-default": `${base}/tools/communities`, en: `${base}/tools/communities`, ar: `${base}/ar/tools/communities` },
    },
  };
})();

export default async function ArCommunityInsightsPage() {
  return <CommunityInsightsPageContent locale="ar" />;
}
