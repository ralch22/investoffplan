import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import FaqHubPage from "@/app/(en)/faq/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider;
// the locale prop keeps topic links in-locale.
export default function ArabicFaqHubPage() {
  return <FaqHubPage locale="ar" />;
}

export const metadata: Metadata = arMeta({
  path: "/faq",
  title: "الأسئلة الشائعة حول العقارات على الخارطة",
  description:
    "إجابات عن الأسئلة الشائعة حول شراء العقارات على الخارطة في الإمارات — خطط السداد، التسليم، البروشورات، والمقارنة.",
});
