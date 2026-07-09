import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Reuse the EN project detail page under /ar — chrome + RTL come from the AR
// layout's LocaleProvider. Metadata reuses the EN generator (unique per-project
// titles/descriptions/OG) with AR canonical + hreflang swapped in.
export { default, generateStaticParams } from "@/app/(en)/projects/[slug]/page";
import { generateMetadata as enGenerateMetadata } from "@/app/(en)/projects/[slug]/page";

// Route config can't be re-exported (must be statically parseable) — keep in
// sync with the EN page: fully-baked catalog, unknown slug = real 404.
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const base = getSiteUrl();
  const en = await enGenerateMetadata(props);
  return {
    ...en,
    alternates: {
      canonical: `${base}/ar/projects/${slug}`,
      languages: {
        en: `${base}/projects/${slug}`,
        ar: `${base}/ar/projects/${slug}`,
      },
    },
  };
}
