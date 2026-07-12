import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import CompareProjectsPage, { generateStaticParams } from "@/app/(en)/compare-projects/[pair]/page";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { generateStaticParams };
export const dynamicParams = false;

export default function ArCompareProjectsPage(props: { params: Promise<{ pair: string }> }) {
  return <CompareProjectsPage {...props} locale="ar" />;
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const base = getSiteUrl();
  const path = `/compare-projects/${pair}`;
  return { alternates: { canonical: `${base}/ar${path}`, languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` } } };
}
