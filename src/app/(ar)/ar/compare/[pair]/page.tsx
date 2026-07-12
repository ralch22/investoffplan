import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompareAreasPage, { generateStaticParams } from "@/app/(en)/compare/[pair]/page";
import { buildAreaComparison } from "@/lib/area-compare";
import { arMeta } from "@/lib/ar-meta";
import { comparePairTitle } from "@/lib/seo-title";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildAreaComparison(pair);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!cmp) notFound();
  const a = cmp.a.area.name;
  const b = cmp.b.area.name;
  return arMeta({
    path: `/compare/${cmp.pairSlug}`,
    title: comparePairTitle(a, b, "areas"),
    description:
      `قارن ${a} و${b} للاستثمار على الخارطة — أسعار دائرة الأراضي والأملاك، سعر القدم، والعائد الإيجاري.`.slice(
        0,
        158,
      ),
  });
}

export default async function ArCompareAreasPage({ params }: { params: Promise<{ pair: string }> }) {
  return <CompareAreasPage params={params} locale="ar" />;
}
