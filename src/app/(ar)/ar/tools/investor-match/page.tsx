import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { InvestorMatchPageContent } from "@/app/(en)/tools/investor-match/page";

const t = getDictionary("ar").tools.investorMatch;

export const metadata: Metadata = arMeta({
  path: "/tools/investor-match",
  title: t.metaTitle,
  description: t.metaDescription,
});

export default async function ArInvestorMatchPage() {
  return <InvestorMatchPageContent locale="ar" />;
}
