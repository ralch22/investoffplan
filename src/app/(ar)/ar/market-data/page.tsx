import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/market-data/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/market-data`, languages: { en: `${base}/market-data`, ar: `${base}/ar/market-data` } } };
})();
