import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { RoiPageContent } from "@/app/(en)/tools/roi/page";

export const metadata: Metadata = arMeta({
  path: "/tools/roi",
  title: "حاسبة العائد على الاستثمار والإيجار للعقارات على الخارطة",
  description:
    "قدّر العائد الإيجاري والارتفاع الرأسمالي وإجمالي العائد لعقارك على الخارطة في الإمارات — مُعبّأ ببيانات دائرة الأراضي والأملاك لعام 2025 وقابل للمشاركة عبر رابط.",
});

export default async function ArRoiPage() {
  return <RoiPageContent locale="ar" />;
}
