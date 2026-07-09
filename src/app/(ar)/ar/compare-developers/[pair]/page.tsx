import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default, generateStaticParams } from "@/app/(en)/compare-developers/[pair]/page";

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const base = getSiteUrl();
  const path = `/compare-developers/${pair}`;
  return { alternates: { canonical: `${base}/ar${path}`, languages: { en: `${base}${path}`, ar: `${base}/ar${path}` } } };
}
