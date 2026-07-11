import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/mortgage/page";

export const metadata: Metadata = arMeta({
  path: "/tools/mortgage",
  title: "حاسبة التمويل العقاري في الإمارات",
  description:
    "احسب الأقساط الشهرية والنقد اللازم للإغلاق مع رسوم دائرة الأراضي واختبار القدرة على تحمّل التمويل للعقارات على الخارطة في الإمارات.",
});
