import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { PaymentPageContent } from "@/app/(en)/tools/payment/page";

export const metadata: Metadata = arMeta({
  path: "/tools/payment",
  title: "حاسبة خطة السداد للعقارات على الخارطة",
  description:
    "قسّم أي خطة سداد (60/40 أو 80/20 أو ما بعد التسليم) إلى مبالغ بالدرهم لكل مرحلة حسب سعر الشراء الخاص بك.",
});

export default async function ArPaymentPage() {
  return <PaymentPageContent locale="ar" />;
}
