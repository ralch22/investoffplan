import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/rent-vs-buy/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/tools/rent-vs-buy`, languages: { en: `${base}/tools/rent-vs-buy`, ar: `${base}/ar/tools/rent-vs-buy` } } };
})();
