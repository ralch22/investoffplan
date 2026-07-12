import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { CompareProjectsIndexContent } from "@/app/(en)/compare-projects/page";

/** Match EN index ISR — reuses lightweight getHubProjectPairs path. */
export const revalidate = 3600;

export const metadata: Metadata = arMeta({
  path: "/compare-projects",
  title: "قارن المشاريع على الخارطة في دبي",
  description:
    "مقارنات مباشرة بين مشاريع دبي على الخارطة — سعر الإطلاق، سعر القدم المربعة، التسليم، خطط الدفع، ومزيج الوحدات.",
});

export default async function ArCompareProjectsIndexPage() {
  return <CompareProjectsIndexContent locale="ar" />;
}
