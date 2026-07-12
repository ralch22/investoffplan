import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { RentVsBuyPageContent } from "@/app/(en)/tools/rent-vs-buy/page";

export const metadata: Metadata = arMeta({
  path: "/tools/rent-vs-buy",
  title: "حاسبة الإيجار مقابل الشراء — عقارات دبي",
  description:
    "قارن الأقساط الشهرية والتكاليف طويلة الأجل بين الإيجار وشراء عقار في الإمارات.",
});

export default async function ArRentVsBuyPage() {
  return <RentVsBuyPageContent locale="ar" />;
}
