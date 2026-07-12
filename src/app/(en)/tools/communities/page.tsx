import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunityInsightsExplorer } from "@/components/community-insights-explorer";
import { getCommunityInsights } from "@/lib/community-insights-data";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Community Insights — Compare Lifestyles & Yields",
  description:
    "Explore UAE communities by lifestyle — family-friendly, waterfront, urban, golf, investment, and luxury.",
  alternates: enMeta("/tools/communities"),
  openGraph: {
    title: "Dubai Community Insights — Compare Lifestyles & Yields",
    description: "Explore UAE communities by lifestyle — family-friendly, waterfront, urban, golf, investment, and luxury.",
    url: "/tools/communities",
    images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
  },
};

export async function CommunityInsightsPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.communityInsightsPage;
  const areas = await getCommunityInsights();
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.dataToolkit, href: "/tools" },
            { label: dict.nav.communityInsights },
          ]}
        />
        <div className="mt-8">
          <CommunityInsightsExplorer areas={areas} />
        </div>
      </main>
    </PageShell>
  );
}

export default async function CommunitiesToolPage() {
  return <CommunityInsightsPageContent />;
}
