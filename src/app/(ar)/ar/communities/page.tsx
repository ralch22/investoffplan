import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/communities/page";

export const metadata: Metadata = arMeta({
  path: "/communities",
  title: "المجتمعات العقارية على الخارطة في الإمارات",
  description:
    "استكشف مجتمعات العقارات على الخارطة في دبي والإمارات مع عدد المشاريع وأسعار الإطلاق وبيانات دائرة الأراضي والأملاك.",
});
