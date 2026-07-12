import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/residential/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/tools/residential`, languages: { "x-default": `${base}/tools/residential`, en: `${base}/tools/residential`, ar: `${base}/ar/tools/residential` } } };
})();
