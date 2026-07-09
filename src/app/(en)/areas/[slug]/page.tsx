import { notFound, permanentRedirect } from "next/navigation";
import { communityForVariantSlug } from "@/lib/communities";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * IA restructure (SEO plan): the 645 breadcrumb-variant area pages collapsed
 * into 94 community pages. Old /areas/{variant} URLs 308 to their community.
 */
export default async function AreaRedirect({ params }: PageProps) {
  const { slug } = await params;
  const community = await communityForVariantSlug(slug);
  if (!community) notFound();
  permanentRedirect(`/communities/${community.slug}`);
}
