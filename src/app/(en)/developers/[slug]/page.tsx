import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { DeveloperAboutSection } from "@/components/developer-about-section";
import { DeveloperContactPanel } from "@/components/developer-contact-panel";
import { DeveloperLogo } from "@/components/developer-logo";
import { DeveloperPaginationLinks } from "@/components/developer-pagination-links";
import { DeveloperProjectCard } from "@/components/developer-project-card";
import { DeveloperProfilePanel } from "@/components/developer-profile-panel";
import { DeveloperSortControl } from "@/components/developer-sort-control";
import {
  getDeveloper,
  getDeveloperProfile,
  getDevelopers,
  getProjectsByDeveloper,
} from "@/lib/catalog";
import { developerDescription, sortDeveloperProjects } from "@/lib/developer-utils";
import {
  buildDeveloperItemListJsonLd,
  buildDeveloperJsonLd,
} from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { enMeta } from "@/lib/ar-meta";
import { DEVELOPER_PAGE_SIZE, type SortOption } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
  /** Set to "ar" by the /ar mirror so links and page chrome localize. */
  locale?: Locale;
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
    title: `New & Off-Plan Projects by ${developer.name}`,
    description: `Browse ${developer.projectCount} off-plan projects by ${developer.name} in the UAE with launch prices, payment plans, and brochures.`,
    alternates: enMeta(`/developers/${slug}`),
  };
}

export default async function DeveloperDetailPage({
  params,
  searchParams,
  locale = "en",
}: PageProps) {
  const dict = getDictionary(locale);
  const { slug } = await params;
  const query = await searchParams;
  const developer = await getDeveloper(slug);
  if (!developer) notFound();

  const sort = (query.sort as SortOption | undefined) ?? "featured";
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const projects = await getProjectsByDeveloper(slug);
  const profile = await getDeveloperProfile(slug);
  const sorted = sortDeveloperProjects(projects, sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / DEVELOPER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * DEVELOPER_PAGE_SIZE,
    currentPage * DEVELOPER_PAGE_SIZE,
  );
  const countLabel =
    developer.numProjectsOnline && developer.numProjectsOnline > developer.projectCount
      ? `${developer.projectCount.toLocaleString()} projects on invest off-plan · ${developer.numProjectsOnline.toLocaleString()} in developer portfolio`
      : `${developer.projectCount.toLocaleString()} project${developer.projectCount === 1 ? "" : "s"}`;
  const allDevelopers = await getDevelopers();
  const others = allDevelopers.filter((dev) => dev.slug !== slug).slice(0, 5);
  const siteUrl = getSiteUrl();
  const developerUrl = `${siteUrl}/developers/${slug}`;
  const jsonLd = buildDeveloperJsonLd({
    developer,
    developerUrl,
    siteUrl,
  });
  const itemListJsonLd = buildDeveloperItemListJsonLd({
    developer,
    projects: sorted,
    developerUrl,
    siteUrl,
  });
  const heroExcerpt = developerDescription(slug, developer.description);

  return (
    <PageShell headerVariant="light">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {sorted.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      ) : null}

      <section className="border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
              <DeveloperLogo
                name={developer.name}
                logoUrl={developer.logoUrl}
                slug={developer.slug}
                size="xl"
                rounded="lg"
                className="border border-border bg-white shadow-sm"
              />
              <div className="min-w-0">
                {developer.foundedYear ? (
                  <p className="text-sm text-muted">
                    {interpolate(dict.developers.foundedIn, { year: developer.foundedYear })}
                  </p>
                ) : null}
                <p className="mt-1 text-2xl font-semibold text-text-dark">{developer.name}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  {heroExcerpt}
                </p>
                <p className="mt-3 text-xs text-muted-light">
                  {developer.projectCount} project{developer.projectCount === 1 ? "" : "s"} ·{" "}
                  {developer.unitCount.toLocaleString()} unit options on invest off-plan
                </p>
              </div>
            </div>
            <DeveloperContactPanel developerName={developer.name} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Developers", href: "/developers" }, { label: developer.name }]} />
        <section aria-labelledby="developer-projects-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                id="developer-projects-heading"
                className="font-display text-3xl font-semibold text-text-dark md:text-4xl"
              >
                {interpolate(dict.developers.projectsByHeading, { name: developer.name })}
              </h1>
              <p className="mt-2 text-sm font-medium text-muted">{countLabel}</p>
            </div>
            <Suspense
              fallback={
                <span className="text-sm text-muted">
                  {dict.serp.sort.sortBy} {dict.serp.sort.featured}
                </span>
              }
            >
              <DeveloperSortControl value={sort} />
            </Suspense>
          </div>

          {pageItems.length === 0 ? (
            <p className="mt-10 text-muted">
              No listings for this developer right now. Check back soon or contact our team.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((project, index) => (
                <DeveloperProjectCard
                  key={project.id}
                  project={project}
                  priorityImage={currentPage === 1 && index < 4}
                />
              ))}
            </div>
          )}

          <DeveloperPaginationLinks
            page={currentPage}
            totalPages={totalPages}
            sort={sort}
          />
        </section>

        {profile ? (
          <div className="mt-12">
            <DeveloperProfilePanel
              developerName={developer.name}
              profile={profile}
            />
          </div>
        ) : null}
      </main>

      <DeveloperAboutSection
        slug={slug}
        name={developer.name}
        description={developer.description}
        projectCount={developer.projectCount}
        cities={developer.cities}
        foundedYear={developer.foundedYear}
      />

      <section className="border-t border-border py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
              Other Developers
            </h2>
            <Link href={localePath(locale, "/developers")} className="text-sm font-semibold text-brand">
              View all developers →
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((dev) => (
              <Link
                key={dev.slug}
                href={localePath(locale, `/developers/${dev.slug}`)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
              >
                <DeveloperLogo
                  name={dev.name}
                  logoUrl={dev.logoUrl}
                  slug={dev.slug}
                  size="xs"
                />
                {dev.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}