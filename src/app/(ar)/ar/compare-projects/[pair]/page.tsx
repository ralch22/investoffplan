import type { Metadata } from "next";
import CompareProjectsPage, { generateStaticParams } from "@/app/(en)/compare-projects/[pair]/page";
import { buildProjectComparison } from "@/lib/project-compare";
import { arMeta } from "@/lib/ar-meta";
import { comparePairTitle } from "@/lib/seo-title";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { generateStaticParams };
export const dynamicParams = false;

export default function ArCompareProjectsPage(props: { params: Promise<{ pair: string }> }) {
  return <CompareProjectsPage {...props} locale="ar" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildProjectComparison(pair, "ar");
  if (!cmp) return arMeta({ path: `/compare-projects/${pair}`, title: "مقارنة غير موجودة" });
  return arMeta({
    path: `/compare-projects/${cmp.pairSlug}`,
    title: comparePairTitle(cmp.a.name, cmp.b.name, "off-plan"),
    description:
      `قارن ${cmp.a.name} و${cmp.b.name} — السعر، سعر القدم، التسليم، وخطة السداد.`.slice(0, 158),
  });
}
