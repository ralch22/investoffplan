import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { RentVsBuyPageContent } from "@/app/(en)/tools/rent-vs-buy/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/rent-vs-buy`,
      languages: { "x-default": `${base}/tools/rent-vs-buy`, en: `${base}/tools/rent-vs-buy`, ar: `${base}/ar/tools/rent-vs-buy` },
    },
  };
})();

export default async function ArRentVsBuyPage() {
  return <RentVsBuyPageContent locale="ar" />;
}
