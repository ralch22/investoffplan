import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RoiEstimator, type RoiCommunity } from "@/components/roi-estimator";
import { getAreas } from "@/lib/catalog";
import { getAreaStats } from "@/lib/dld-area-stats";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "Off-Plan ROI & Rental Yield Estimator — Dubai",
  description:
    "Estimate off-plan rental yield, capital appreciation, and total return from your inputs and 2025 DLD market data — cash invested, net yield, and payback in one view.",
  alternates: enMeta("/tools/roi"),
};

/**
 * Server-resolve the pruned {slug → DLD stats} map so the client tool can prefill
 * yield/appreciation/size without importing the server-only dld-area-stats module.
 * Only communities that actually carry DLD 2025 signal are offered.
 */
async function getRoiCommunities(): Promise<RoiCommunity[]> {
  const areas = await getAreas();
  const covered: RoiCommunity[] = [];
  for (const area of areas) {
    const s = getAreaStats(area.name);
    if (!s) continue;
    if (s.grossYieldPct == null && s.appreciationPct == null && s.medianPpsqft == null) {
      continue;
    }
    covered.push({
      slug: area.slug,
      name: area.name,
      grossYieldPct: s.grossYieldPct,
      appreciationPct: s.appreciationPct,
      medianPpsqft: s.medianPpsqft,
    });
  }
  return covered.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function RoiToolPage() {
  const [heroImage, communities] = await Promise.all([
    getHeroImage(),
    getRoiCommunities(),
  ]);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="ROI & yield estimator"
        subtitle="Model off-plan rental yield, appreciation, and total return — prefilled with 2025 DLD market data."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Data toolkit", href: "/tools" },
            { label: "ROI estimator" },
          ]}
        />
        <div className="mt-8">
          <RoiEstimator communities={communities} />
        </div>
      </main>
    </PageShell>
  );
}
