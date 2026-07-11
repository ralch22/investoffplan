import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default } from "@/app/(en)/tools/investor-match/page";

const t = getDictionary("ar").tools.investorMatch;

export const metadata: Metadata = arMeta({
  path: "/tools/investor-match",
  title: t.metaTitle,
  description: t.metaDescription,
});
