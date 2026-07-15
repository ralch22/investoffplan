import type { Metadata } from "next";
import SoldPricesHubPage from "@/app/(en)/sold-prices/page";
import { getSiteUrl } from "@/lib/site-url";

// AR mirror — chrome + RTL from the AR layout's LocaleProvider.
export default function ArSoldPricesHubPage() {
  return <SoldPricesHubPage locale="ar" />;
}

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "أسعار البيع في دبي — معاملات دائرة الأراضي حسب المجتمع",
    description:
      "أحدث أسعار البيع في مجتمعات دبي من البيانات المفتوحة لدائرة الأراضي والأملاك: معاملات سكنية مجهولة الهوية مع السعر وسعر القدم المربعة وعدد الغرف ونوع التسجيل.",
    alternates: {
      canonical: `${base}/ar/sold-prices`,
      languages: {
        "x-default": `${base}/sold-prices`,
        en: `${base}/sold-prices`,
        ar: `${base}/ar/sold-prices`,
      },
    },
  };
}
