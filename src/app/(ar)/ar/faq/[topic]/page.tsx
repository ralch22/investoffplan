import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
export { default, generateStaticParams } from "@/app/(en)/faq/[topic]/page";

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const base = getSiteUrl();
  const path = `/faq/${topic}`;
  return { alternates: { canonical: `${base}/ar${path}`, languages: { "x-default": `${base}${path}`, en: `${base}${path}`, ar: `${base}/ar${path}` } } };
}
