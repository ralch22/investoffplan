import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getLocationGuide, guideText } from "@/lib/location-guides";
import LocationGuidePage, { generateStaticParams } from "@/app/(en)/locations/[slug]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getLocationGuide(slug);
  if (!guide) return arMeta({ path: `/locations/${slug}` });
  // Prefer AR h1/intro for <title>/description — guide.title is EN-only (#269).
  const arTitle = guideText(guide, "h1", "ar");
  const arIntro = guideText(guide, "intro", "ar");
  return {
    ...arMeta({ path: `/locations/${slug}` }),
    title: arTitle,
    description: arIntro.slice(0, 160),
  };
}

export default async function ArLocationGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <LocationGuidePage params={params} locale="ar" />;
}
