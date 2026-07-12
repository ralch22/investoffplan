import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { PriceMapPageContent } from "@/app/(en)/tools/price-map/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/price-map`,
      languages: { "x-default": `${base}/tools/price-map`, en: `${base}/tools/price-map`, ar: `${base}/ar/tools/price-map` },
    },
  };
})();

interface PageProps {
  searchParams: Promise<{ beds?: string; type?: string; city?: string }>;
}

export default async function ArPriceMapPage({ searchParams }: PageProps) {
  return <PriceMapPageContent locale="ar" searchParams={searchParams} />;
}
