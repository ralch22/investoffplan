import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/faq/page";

export const metadata: Metadata = arMeta({
  path: "/faq",
  title: "الأسئلة الشائعة حول العقارات على الخارطة",
  description:
    "إجابات عن الأسئلة الشائعة حول شراء العقارات على الخارطة في الإمارات — خطط السداد، التسليم، البروشورات، والمقارنة.",
});
