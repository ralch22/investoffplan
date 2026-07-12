import { notFound, permanentRedirect } from "next/navigation";
import { communityForVariantSlug, getCommunities } from "@/lib/communities";
import { type Locale, localePath } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}

/**
 * IA restructure (SEO plan): the 645 breadcrumb-variant area pages collapsed
 * into 94 community pages. Old /areas/{variant} URLs 308 to their community.
 */
export default async function AreaRedirect({ params, locale = "en" }: PageProps) {
  const { slug } = await params;
  const community = await communityForVariantSlug(slug);
  if (!community) notFound();
  permanentRedirect(localePath(locale, `/communities/${community.slug}`));
}

/** Pre-render all known variant slugs so both EN and AR routes are static. */
export async function generateStaticParams() {
  const communities = await getCommunities();
  return communities.flatMap((c) =>
    c.variantSlugs.map((slug) => ({ slug })),
  );
}
