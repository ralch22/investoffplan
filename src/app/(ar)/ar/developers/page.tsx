import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/developers/page";

export const metadata: Metadata = arMeta({
  path: "/developers",
  title: "المطوّرون العقاريون على الخارطة في الإمارات",
  description:
    "تصفّح المطوّرين العقاريين على الخارطة في الإمارات مع كتالوج المشاريع وأسعار الإطلاق وخطط السداد والبروشورات.",
});
