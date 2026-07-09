import { notFound, permanentRedirect } from "next/navigation";
import { communityForVariantSlug } from "@/lib/communities";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// IA restructure (SEO plan): breadcrumb-variant area URLs 308 to their community.
export default async function ArAreaRedirect({ params }: PageProps) {
  const { slug } = await params;
  const community = await communityForVariantSlug(slug);
  if (!community) notFound();
  permanentRedirect(`/ar/communities/${community.slug}`);
}
