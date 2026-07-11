import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ResidentialInsightsTable } from "@/components/residential-insights-table";
import { getResidentialBuildings } from "@/lib/residential-insights";
import { getAreas } from "@/lib/catalog";
import { getHeroImage } from "@/lib/area-images";

export const metadata: Metadata = {
  title: "Dubai Residential Insights — Launch Prices & AED/sqft",
  description:
    "Launch-price intelligence per off-plan project — averages, price per sqft, and links to full PDPs.",
};

interface PageProps {
  searchParams: Promise<{ area?: string; q?: string; city?: string }>;
}

export default async function ResidentialInsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const heroImage = await getHeroImage();
  const areas = await getAreas();
  const buildings = await getResidentialBuildings({
    areaSlug: params.area,
    city: params.city,
    query: params.q,
    limit: 100,
  });

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Residential insights"
        subtitle="Launch-price data per project — compare towers and compounds in your shortlisted areas."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Data toolkit", href: "/tools" },
            { label: "Residential insights" },
          ]}
        />

        <form className="mt-8 flex flex-wrap items-end gap-4" method="get">
          <label className="block text-sm">
            <span className="font-medium text-text-dark">Search project</span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Tower or developer name"
              className="iop-input mt-1 min-w-[200px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-text-dark">Area</span>
            <select name="area" defaultValue={params.area ?? ""} className="iop-input mt-1">
              <option value="">All areas</option>
              {areas.slice(0, 80).map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Filter
          </button>
          {(params.area || params.q) ? (
            <Link href="/tools/residential" className="text-sm font-semibold text-brand">
              Clear filters
            </Link>
          ) : null}
        </form>

        <p className="mt-4 text-sm text-muted">
          Showing {buildings.length} projects with launch pricing. Resale rent trends require
          a licensed market feed — we surface off-plan benchmarks instead.
        </p>

        <div className="mt-6">
          <ResidentialInsightsTable buildings={buildings} />
        </div>
      </main>
    </PageShell>
  );
}