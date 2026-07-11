import type { Metadata } from "next";
import { getProjectBySlug } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

// Reuse the EN project detail page under /ar — chrome + RTL come from the AR
// layout's LocaleProvider. Metadata builds a localized Arabic title per project
// with AR canonical + hreflang.
export { default, generateStaticParams } from "@/app/(en)/projects/[slug]/page";

// Route config can't be re-exported (must be statically parseable) — keep in
// sync with the EN page: fully-baked catalog, unknown slug = real 404.
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const base = getSiteUrl();
  const path = `/projects/${slug}`;
  const alternates = {
    canonical: `${base}/ar${path}`,
    languages: { en: `${base}${path}`, ar: `${base}/ar${path}` },
  };
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "المشروع غير موجود", alternates };
  const areaName = project.area.split(",")[0]?.trim() || project.area;
  return {
    title: `${project.name} — عقارات على الخارطة في ${areaName}`,
    description: `${project.name} من ${project.developer} في ${areaName} — مخططات الطوابق والبروشور وخطط السداد والأسعار على مستوى الوحدة.`,
    alternates,
  };
}
