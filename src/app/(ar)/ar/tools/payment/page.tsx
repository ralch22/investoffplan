import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/payment/page";

export const metadata: Metadata = arMeta({
  path: "/tools/payment",
  title: "حاسبة خطة السداد للعقارات على الخارطة",
  description:
    "قسّم أي خطة سداد (60/40 أو 80/20 أو ما بعد التسليم) إلى مبالغ بالدرهم لكل مرحلة حسب سعر الشراء الخاص بك.",
});
