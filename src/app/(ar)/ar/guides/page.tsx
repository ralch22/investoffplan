import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import InsightsPage from "@/app/(en)/guides/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider;
// the locale prop keeps guide cards and CTAs in-locale.
export default function ArabicInsightsPage() {
  return <InsightsPage locale="ar" />;
}

export const metadata: Metadata = arMeta({
  path: "/guides",
  title: "أدلّة شراء العقارات على الخارطة في الإمارات",
  description:
    "أدلّة المشترين للاستثمار في العقارات على الخارطة في الإمارات — خطط السداد، التأشيرة الذهبية، اختيار المطوّر، والمزيد.",
});
