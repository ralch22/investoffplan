import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ProjectMap } from "@/components/project-map";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getCatalogApi } from "@/lib/catalog";
import { getHeroImage } from "@/lib/area-images";
import { getMapProjectsFromList } from "@/lib/map-data";

export const metadata: Metadata = {
  title: "Project map",
  description:
    "Explore UAE off-plan projects on an interactive map with pricing, handover, and direct links to brochures.",
};

function MapLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="skeleton h-12 rounded-xl" />
      <div className="skeleton min-h-[360px] rounded-2xl" />
    </div>
  );
}

interface MapPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const stats = await getCatalogAnalytics();
  const { project: projectSlug } = await searchParams;
  const api = await getCatalogApi();
  const mapProjects = getMapProjectsFromList(api.projects);
  const initialSelected = projectSlug
    ? mapProjects.find((p) => p.slug === projectSlug) ?? null
    : null;
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Project map"
        subtitle={`${stats.withCoords.toLocaleString()} map-ready projects across the UAE`}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Suspense fallback={<MapLoading />}>
          <ProjectMap initialProjects={mapProjects} initialSelected={initialSelected} />
        </Suspense>
      </main>

      <section className="border-t border-border bg-white py-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 md:grid-cols-2 md:items-center md:px-8">
          <div className="rounded-2xl bg-brand/10 p-8">
            <p className="text-4xl font-semibold text-brand">10 Years</p>
            <p className="mt-2 text-xl font-semibold text-text-dark">Golden Visa</p>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Qualifying off-plan investments may unlock long-term UAE residency benefits.
            Use the map to shortlist projects, then compare units and download brochures
            before you speak with an advisor.
          </p>
        </div>
      </section>
    </PageShell>
  );
}