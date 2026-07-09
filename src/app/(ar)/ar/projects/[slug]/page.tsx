import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Reuse the EN project detail page under /ar — chrome + RTL come from the AR
// layout's LocaleProvider. AR metadata (canonical + hreflang) is defined here.
export { default, generateStaticParams } from "@/app/(en)/projects/[slug]/page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const base = getSiteUrl();
  return {
    alternates: {
      canonical: `${base}/ar/projects/${slug}`,
      languages: {
        en: `${base}/projects/${slug}`,
        ar: `${base}/ar/projects/${slug}`,
      },
    },
  };
}
