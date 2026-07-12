import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import CompareDevelopersPage, { generateStaticParams } from "@/app/(en)/compare-developers/[pair]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const base = getSiteUrl();
  const path = `/compare-developers/${pair}`;
  return { alternates: { canonical: `${base}/ar${path}`, languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` } } };
}

export default async function ArCompareDevelopersPage({ params }: { params: Promise<{ pair: string }> }) {
  return <CompareDevelopersPage params={params} locale="ar" />;
}
