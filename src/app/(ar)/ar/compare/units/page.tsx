import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/compare/units/page";

export const metadata: Metadata = {
  ...arMeta({
    path: "/compare/units",
    title: "مقارنة وحدات عقارية",
    description:
      "قارن بين ثلاث وحدات عقارية على الخارطة جنبًا إلى جنب — السعر والتسليم والكتيبات وخطط السداد.",
  }),
  robots: { index: false, follow: true },
};
