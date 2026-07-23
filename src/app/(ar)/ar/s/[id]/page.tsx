import type { Metadata } from "next";

// Reuse the EN shared-shortlist page under /ar — RTL and Arabic chrome come
// from the AR layout's LocaleProvider, and the locale="ar" prop threads the
// Arabic copy into the server page. Same pattern as the project detail page.
import SharedShortlistPage from "@/app/(en)/s/[id]/page";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: "قائمة مشاريع مشتركة | invest off-plan",
    description: "قائمة مختارة من مشاريع دبي على الخارطة.",
    robots: { index: false, follow: true },
    alternates: { canonical: `${getSiteUrl()}/ar/s/${id}` },
  };
}

export default function ArabicSharedShortlistPage(props: {
  params: Promise<{ id: string }>;
}) {
  return <SharedShortlistPage {...props} locale="ar" />;
}
