import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { CommunityInsightsPageContent } from "@/app/(en)/tools/communities/page";

export const metadata: Metadata = arMeta({
  path: "/tools/communities",
  title: "رؤى مجتمعات دبي — قارن أنماط الحياة والعوائد",
  description:
    "استكشف مجتمعات الإمارات حسب أسلوب الحياة — عائلية، واجهة بحرية، حضرية، غولف، استثمار، وفاخرة.",
});

export default async function ArCommunityInsightsPage() {
  return <CommunityInsightsPageContent locale="ar" />;
}
