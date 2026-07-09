import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// AR reuse of the EN page — chrome + RTL from the AR layout's LocaleProvider.
// Metadata reuses the EN generator (unique per-community titles) with AR
// canonical + hreflang swapped in.
export { default, generateStaticParams } from "@/app/(en)/communities/[slug]/page";
import { generateMetadata as enGenerateMetadata } from "@/app/(en)/communities/[slug]/page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const base = getSiteUrl();
  const path = `/communities/${slug}`;
  const en = await enGenerateMetadata(props);
  return {
    ...en,
    alternates: {
      canonical: `${base}/ar${path}`,
      languages: { en: `${base}${path}`, ar: `${base}/ar${path}` },
    },
  };
}
