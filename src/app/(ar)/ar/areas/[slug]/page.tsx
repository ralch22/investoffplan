// IA restructure (SEO plan): breadcrumb-variant area URLs 308 to their community.
// AR mirror — delegates to the EN implementation with locale="ar".
import AreasSlugPage, { generateStaticParams } from "@/app/(en)/areas/[slug]/page";

export { generateStaticParams };
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArAreasSlugPage({ params }: PageProps) {
  return AreasSlugPage({ params, locale: "ar" });
}
