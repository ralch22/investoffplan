import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/investor-match/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/tools/investor-match`,
      languages: {
        en: `${base}/tools/investor-match`,
        ar: `${base}/ar/tools/investor-match`,
      },
    },
  };
})();
