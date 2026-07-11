import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/guides/page";

export const metadata: Metadata = arMeta({
  path: "/guides",
  title: "أدلّة شراء العقارات على الخارطة في الإمارات",
  description:
    "أدلّة المشترين للاستثمار في العقارات على الخارطة في الإمارات — خطط السداد، التأشيرة الذهبية، اختيار المطوّر، والمزيد.",
});
