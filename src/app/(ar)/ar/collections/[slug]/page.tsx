import type { Metadata } from "next";
import { arMeta } from "@/lib/ar-meta";
import { getCollectionPage } from "@/lib/collections";
import CollectionsSlugPage, {
  generateStaticParams,
} from "@/app/(en)/collections/[slug]/page";
import { getDictionary } from "@/i18n";

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  const dict = getDictionary("ar");
  const pagesCopy = dict.pages.collections.pages as Record<
    string,
    { title: string; h1: string; description: string }
  >;
  const copy = page ? pagesCopy[slug] : undefined;
  if (!page) return arMeta({ path: `/collections/${slug}` });
  return {
    ...arMeta({ path: `/collections/${slug}` }),
    title: copy?.title ?? page.title,
    description: copy?.description ?? page.description,
  };
}

export default function ArCollectionsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CollectionsSlugPage params={params} locale="ar" />;
}
