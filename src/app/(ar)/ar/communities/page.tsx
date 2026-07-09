import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/communities/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/communities`, languages: { en: `${base}/communities`, ar: `${base}/ar/communities` } } };
})();
