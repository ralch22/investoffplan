import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { arMeta } from "@/lib/ar-meta";
import { getCollectionPage } from "@/lib/collections";
import CollectionsSlugPage, {
  collectionChrome,
  generateStaticParams,
} from "@/app/(en)/collections/[slug]/page";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  // Soft metadata (no real 404) with HTTP 200 is banned (#241 / #322).
  if (!page) notFound();
  const chrome = collectionChrome("ar", slug);
  return {
    ...arMeta({ path: `/collections/${slug}` }),
    title: chrome?.title ?? page.title,
    description: chrome?.description ?? page.description,
  };
}

export default async function ArCollectionsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CollectionsSlugPage params={params} locale="ar" />;
}
