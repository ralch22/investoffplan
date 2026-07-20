import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getHeroImage } from "@/lib/area-images";
import { FeatureYourProjectView } from "@/components/feature-your-project-view";

export const metadata: Metadata = {
  title: "أبرِز مشروعك — أعلن على invest off-plan",
  description:
    "للمطوّرين والوسطاء: أبرِز مشروعك على الخارطة في دبي على invest off-plan — إبراز في الصفحة الرئيسية، وظهور في البحث، وتوجيه أولوي للعملاء المحتملين. اطلب عرضاً مخصّصاً.",
  alternates: {
    canonical: `${getSiteUrl()}/ar/feature-your-project`,
    languages: {
      "x-default": `${getSiteUrl()}/feature-your-project`,
      en: `${getSiteUrl()}/feature-your-project`,
      ar: `${getSiteUrl()}/ar/feature-your-project`,
    },
  },
  robots: { index: true, follow: true },
};

export default async function ArFeatureYourProjectPage() {
  const heroImage = await getHeroImage();
  return <FeatureYourProjectView locale="ar" heroImage={heroImage} />;
}
