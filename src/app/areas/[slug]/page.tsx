import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { getArea, getAreas, getProjectsByArea } from "@/lib/catalog";
import { areaTagline } from "@/lib/figma-copy";
import { getAreaImage } from "@/lib/area-images";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = await getArea(slug);
  if (!area) return { title: "Area not found" };
  return {
    title: `${area.name} off-plan projects`,
    description: `${area.projectCount} off-plan projects in ${area.name}, ${area.cityLabel}.`,
  };
}

export default async function AreaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const area = await getArea(slug);
  if (!area) notFound();

  const projects = await getProjectsByArea(slug);
  const allAreas = await getAreas();
  const similar = allAreas
    .filter((a) => a.slug !== slug && a.city === area.city)
    .slice(0, 4);
  const heroImage = await getAreaImage(area.name);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={area.name}
        italicTitle
        subtitle={areaTagline(slug, area.name)}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-text-dark">
            Current Projects<span className="text-brand">.</span>
          </h2>
          <Link
            href={`/projects?query=${encodeURIComponent(area.name)}`}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            View all
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">
          {area.projectCount} projects · {area.unitCount} unit options in {area.cityLabel}
        </p>

        {projects.length === 0 ? (
          <p className="mt-8 text-muted">No projects listed in this area yet.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project, index) => (
              <ShowcaseProjectCard key={project.id} project={project} featured={index === 0} />
            ))}
          </div>
        )}
      </main>

      {similar.length > 0 ? (
        <section className="bg-surface-darker py-14 text-white">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">
                Similar Areas<span className="text-brand">.</span>
              </h2>
              <Link
                href="/areas"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                See all locations
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <Link
                  key={item.slug}
                  href={`/areas/${item.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-brand"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {item.projectCount} projects
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}