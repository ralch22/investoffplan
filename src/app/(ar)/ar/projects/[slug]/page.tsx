import type { Metadata } from "next";
import { getCatalogApi, getProjectBySlug } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

// Reuse the EN project detail page under /ar — chrome + RTL come from the AR
// layout's LocaleProvider, and the locale="ar" prop threads the Arabic
// dictionary into the server page + its server children. Metadata builds a
// localized Arabic title per project with AR canonical + hreflang.
import ProjectDetailPage, {
  generateStaticParams,
} from "@/app/(en)/projects/[slug]/page";

export { generateStaticParams };

export default function ArabicProjectDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ProjectDetailPage {...props} locale="ar" />;
}

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

  // Mirror the EN title logic: append the developer only on a genuine
  // (name, area, city) collision, and drop the "off-plan" frame for sold-out
  // projects (so the 212 sold-out AR titles aren't mislabelled على الخارطة).
  const api = await getCatalogApi();
  const collisionKey = (p: (typeof api.projects)[number]) =>
    `${p.name.trim().toLowerCase()}|${p.area.split(",")[0].trim().toLowerCase()}|${p.city}`;
  const thisKey = collisionKey(project);
  const isCollision =
    api.projects.filter((p) => collisionKey(p) === thisKey).length > 1;
  const nameBit = isCollision
    ? `${project.name} من ${project.developer}`
    : project.name;
  const title =
    project.status === "sold-out"
      ? `${nameBit} — ${areaName}`
      : `${nameBit} — عقارات على الخارطة في ${areaName}`;

  return {
    title,
    description: `${project.name} من ${project.developer} في ${areaName} — مخططات الطوابق والبروشور وخطط السداد والأسعار على مستوى الوحدة.`,
    alternates,
  };
}
