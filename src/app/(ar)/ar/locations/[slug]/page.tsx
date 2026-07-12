import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getLocationGuide } from "@/lib/location-guides";

export { default, generateStaticParams } from "@/app/(en)/locations/[slug]/page";
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getLocationGuide(slug);
  if (!guide) return arMeta({ path: `/locations/${slug}` });
  return {
    ...arMeta({ path: `/locations/${slug}` }),
    title: guide.title,
    description: guide.intro.slice(0, 160),
  };
}
