import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/news/page";

export const metadata: Metadata = arMeta({
  path: "/news",
  title: "أخبار العقارات على الخارطة في الإمارات",
  description:
    "أحدث أخبار وتحديثات سوق العقارات على الخارطة في دبي والإمارات.",
});
