import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { PriceMapPageContent } from "@/app/(en)/tools/price-map/page";

export const metadata: Metadata = arMeta({
  path: "/tools/price-map",
  title: "خريطة أسعار العقارات في دبي — أسعار الإطلاق حسب المجتمع",
  description:
    "اعثر على مجتمعات الإمارات ضمن ميزانيتك عبر خريطة تفاعلية لأسعار الإطلاق. صفِّ حسب غرف النوم ونوع العقار.",
});

interface PageProps {
  searchParams: Promise<{ beds?: string; type?: string; city?: string }>;
}

export default async function ArPriceMapPage({ searchParams }: PageProps) {
  return <PriceMapPageContent locale="ar" searchParams={searchParams} />;
}
