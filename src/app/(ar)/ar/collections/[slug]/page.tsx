import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getCollectionPage } from "@/lib/collections";

export { default, generateStaticParams } from "@/app/(en)/collections/[slug]/page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  if (!page) return arMeta({ path: `/collections/${slug}` });
  return {
    ...arMeta({ path: `/collections/${slug}` }),
    title: page.title,
    description: page.description,
  };
}
