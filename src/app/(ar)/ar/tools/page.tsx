import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/page";

export const metadata: Metadata = arMeta({
  path: "/tools",
  title: "أدوات بيانات العقارات في الإمارات — أدوات مجانية للمستثمرين",
  description:
    "مجموعة أدوات ذكاء عقاري للمشترين على الخارطة في الإمارات — خريطة الأسعار، رؤى المجتمعات، حاسبة الإيجار مقابل الشراء، وبيانات إطلاق المشاريع السكنية.",
});
