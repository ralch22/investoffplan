import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { DataGuruToolCard } from "@/components/dataguru-tool-card";
import { InvestorMatchToolCard } from "@/components/investor-match-tool-card";
import { LocaleLink } from "@/components/locale-link";
import { DATAGURU_TOOLS } from "@/lib/dataguru";
import { getHeroImage } from "@/lib/area-images";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Property Data Toolkit — Free Investor Tools",
  description:
    "Property intelligence toolkit for UAE off-plan buyers — price map, community insights, rent vs buy calculator, and residential launch data.",
  alternates: enMeta("/tools"),
};

export async function ToolsHubPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.hubPage;
  const heroImage = await getHeroImage();
  const analytics = await getCatalogAnalytics();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          {interpolate(t.toolsIntro, { count: analytics.unitCount.toLocaleString() })}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DATAGURU_TOOLS.map((tool) => (
            <DataGuruToolCard key={tool.slug} tool={tool} />
          ))}
          <InvestorMatchToolCard />
        </div>
      </main>
    </PageShell>
  );
}

export default async function ToolsHubPage() {
  return <ToolsHubPageContent />;
}
