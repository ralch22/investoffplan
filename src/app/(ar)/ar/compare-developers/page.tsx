import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { CompareDevelopersIndexContent } from "@/app/(en)/compare-developers/page";

/** Match EN index ISR — reuses lightweight getHubDeveloperPairs path. */
export const revalidate = 3600;

export const metadata: Metadata = arMeta({
  path: "/compare-developers",
  title: "قارن مطوّري المشاريع على الخارطة في دبي",
  description:
    "مقارنات جنبًا إلى جنب بين المطوّرين — حجم المحفظة، أسعار الدخول، المجتمعات، وجداول التسليم من كتالوجنا المباشر.",
});

export default async function ArCompareDevelopersIndexPage() {
  return <CompareDevelopersIndexContent locale="ar" />;
}
