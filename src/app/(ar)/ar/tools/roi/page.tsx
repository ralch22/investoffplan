import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider,
// which also feeds the Arabic dictionary into the client <RoiEstimator>.
export { default } from "@/app/(en)/tools/roi/page";

export const metadata: Metadata = arMeta({
  path: "/tools/roi",
  title: "حاسبة العائد على الاستثمار والإيجار للعقارات على الخارطة",
  description:
    "قدّر العائد الإيجاري والارتفاع الرأسمالي وإجمالي العائد لعقارك على الخارطة في الإمارات — مُعبّأ ببيانات دائرة الأراضي والأملاك لعام 2025 وقابل للمشاركة عبر رابط.",
});
