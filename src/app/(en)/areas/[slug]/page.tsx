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
 *
 * Covers two alias classes (both via communityForVariantSlug):
 * - Breadcrumb variants from the catalog (variantSlugs)
 * - Short marketing nicknames (jvc, jbr, jlt, …) from
 *   community-nickname-aliases.ts — also registered as next.config redirects
 *   so OpenNext/Workers hit a 308 before the page runs.
 */
export default async function AreaRedirect({ params, locale = "en" }: PageProps) {
  const { slug } = await params;
  const community = await communityForVariantSlug(slug);
  if (!community) notFound();
  permanentRedirect(localePath(locale, `/communities/${community.slug}`));
}

/** Pre-render all known variant + nickname slugs so both EN and AR routes are static. */
export async function generateStaticParams() {
  const { COMMUNITY_NICKNAME_ALIASES } = await import(
    "@/lib/community-nickname-aliases"
  );
  const communities = await getCommunities();
  const variantParams = communities.flatMap((c) =>
    c.variantSlugs.map((slug) => ({ slug })),
  );
  const nicknameParams = Object.keys(COMMUNITY_NICKNAME_ALIASES).map((slug) => ({
    slug,
  }));
  return [...variantParams, ...nicknameParams];
}
