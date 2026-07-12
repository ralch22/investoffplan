import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/price-map/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/tools/price-map`, languages: { "x-default": `${base}/tools/price-map`, en: `${base}/tools/price-map`, ar: `${base}/ar/tools/price-map` } } };
})();
