import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import CompareAreasPage, { generateStaticParams } from "@/app/(en)/compare/[pair]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const base = getSiteUrl();
  const path = `/compare/${pair}`;
  return { alternates: { canonical: `${base}/ar${path}`, languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` } } };
}

export default async function ArCompareAreasPage({ params }: { params: Promise<{ pair: string }> }) {
  return <CompareAreasPage params={params} locale="ar" />;
}
