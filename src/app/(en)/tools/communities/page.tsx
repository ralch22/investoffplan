import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunityInsightsExplorer } from "@/components/community-insights-explorer";
import { getCommunityInsights } from "@/lib/community-insights-data";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "Dubai Community Insights — Compare Lifestyles & Yields",
  description:
    "Explore UAE communities by lifestyle — family-friendly, waterfront, urban, golf, investment, and luxury.",
  alternates: enMeta("/tools/communities"),
};

export default async function CommunitiesToolPage() {
  const areas = await getCommunityInsights();
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Community insights"
        subtitle="Find communities that match your lifestyle — then browse off-plan projects in each area."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Data toolkit", href: "/tools" },
            { label: "Community insights" },
          ]}
        />
        <div className="mt-8">
          <CommunityInsightsExplorer areas={areas} />
        </div>
      </main>
    </PageShell>
  );
}