import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { DataGuruToolCard } from "@/components/dataguru-tool-card";
import { InvestorMatchToolCard } from "@/components/investor-match-tool-card";
import { DATAGURU_TOOLS } from "@/lib/dataguru";
import { getHeroImage } from "@/lib/area-images";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";

export const metadata: Metadata = {
  title: "Dubai Property Data Toolkit — Free Investor Tools",
  description:
    "Property intelligence toolkit for UAE off-plan buyers — price map, community insights, rent vs buy calculator, and residential launch data.",
};

export default async function ToolsHubPage() {
  const heroImage = await getHeroImage();
  const analytics = await getCatalogAnalytics();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Know your next move"
        subtitle="Five data tools for smarter off-plan decisions — parity with Property Finder DataGuru, tuned for launch inventory."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          DataGuru on Property Finder covers rental heatmaps and resale towers. invest
          off-plan mirrors the same five-tool structure using our catalog of{" "}
          {analytics.unitCount.toLocaleString()} launch units — plus brochures, compare,
          and payment calculators they do not offer on new projects.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DATAGURU_TOOLS.map((tool) => (
            <DataGuruToolCard key={tool.slug} tool={tool} />
          ))}
          <InvestorMatchToolCard />
        </div>

        <section className="mt-14 rounded-2xl border border-border bg-surface-alt p-8">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            How this maps to Property Finder DataGuru
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-text-dark">Price Map</strong> — community launch-price
              tiers instead of rental heatmaps (same budget-fit workflow).
            </li>
            <li>
              <strong className="text-text-dark">Community Insights</strong> — lifestyle
              clusters with off-plan project counts per area.
            </li>
            <li>
              <strong className="text-text-dark">Rent vs Buy</strong> — full calculator with
              mortgage, rent growth, and equity modelling.
            </li>
            <li>
              <strong className="text-text-dark">Residential Insights</strong> — per-project
              launch pricing and sqft benchmarks (resale trends require a licensed feed).
            </li>
            <li>
              <strong className="text-text-dark">New Projects</strong> —{" "}
              <Link href="/projects" className="text-brand underline">
                unit-level SERP
              </Link>{" "}
              with compare and brochures.
            </li>
          </ul>
        </section>
      </main>
    </PageShell>
  );
}