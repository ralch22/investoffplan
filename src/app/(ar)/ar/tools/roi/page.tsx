import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider,
// which also feeds the Arabic dictionary into the client <RoiEstimator>.
export { default } from "@/app/(en)/tools/roi/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/roi`,
      languages: { en: `${base}/tools/roi`, ar: `${base}/ar/tools/roi` },
    },
  };
})();
