import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { getDeveloper, getDevelopers, getProjectsByDeveloper } from "@/lib/catalog";
import { developerBlurb } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";
import { buildDeveloperJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const developers = await getDevelopers();
  return developers.map((developer) => ({ slug: developer.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloper(slug);
  if (!developer) return { title: "Developer not found" };
  return {
    title: `${developer.name} off-plan projects`,
    description: `Browse ${developer.projectCount} off-plan projects by ${developer.name} in the UAE.`,
  };
}

export default async function DeveloperDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const developer = await getDeveloper(slug);
  if (!developer) notFound();

  const projects = await getProjectsByDeveloper(slug);
  const active = projects.filter((p) => p.status !== "sold-out");
  const soldOut = projects.filter((p) => p.status === "sold-out");
  const allDevelopers = await getDevelopers();
  const others = allDevelopers.filter((d) => d.slug !== slug).slice(0, 5);
  const [featured, ...rest] = active;
  const siteUrl = getSiteUrl();
  const developerUrl = `${siteUrl}/developers/${slug}`;
  const jsonLd = buildDeveloperJsonLd({
    developer,
    developerUrl,
    siteUrl,
  });
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero title={`${developer.name} Properties`} italicTitle imageUrl={heroImage} align="center">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-6 text-left backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-white/90">{developerBlurb(slug)}</p>
          {featured ? (
            <PrimaryButton href={`/projects/${featured.slug}`} className="mt-4">
              Learn More
            </PrimaryButton>
          ) : null}
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-text-dark">
            Current Projects<span className="text-brand">.</span>
          </h2>
          <Link href="/projects" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
            View All
          </Link>
        </div>

        {active.length === 0 ? (
          <p className="mt-8 text-muted">No active listings for this developer right now.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {featured ? <ShowcaseProjectCard project={featured} featured /> : null}
            {rest.slice(0, featured ? 3 : 6).map((project) => (
              <ShowcaseProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      {soldOut.length > 0 ? (
        <section className="bg-surface-darker py-14 text-white">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">
                Sold Out Projects<span className="text-brand">.</span>
              </h2>
              <Link
                href="/projects"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                View All
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {soldOut.slice(0, 3).map((project) => (
                <ShowcaseProjectCard key={project.id} project={project} dark />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold text-text-dark">
              Other Developers
            </h2>
            <Link href="/developers" className="text-sm font-semibold text-brand">
              View All Developers →
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((dev) => (
              <Link
                key={dev.slug}
                href={`/developers/${dev.slug}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
              >
                {dev.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}