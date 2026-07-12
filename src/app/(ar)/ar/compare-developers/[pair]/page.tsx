import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompareDevelopersPage, { generateStaticParams } from "@/app/(en)/compare-developers/[pair]/page";
import { buildDeveloperComparison } from "@/lib/developer-compare";
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
  const cmp = await buildDeveloperComparison(pair);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!cmp) notFound();
  return arMeta({
    path: `/compare-developers/${cmp.pairSlug}`,
    title: comparePairTitle(cmp.a.name, cmp.b.name, "developers"),
    description:
      `قارن ${cmp.a.name} و${cmp.b.name} — حجم المحفظة، أسعار الإطلاق، المجتمعات، وخط التسليم.`.slice(
        0,
        158,
      ),
  });
}

export default async function ArCompareDevelopersPage({ params }: { params: Promise<{ pair: string }> }) {
  return <CompareDevelopersPage params={params} locale="ar" />;
}
