"use client";

import { LocaleLink } from "@/components/locale-link";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { useI18n } from "@/i18n/locale-provider";
import type { Project } from "@/lib/types";

interface HomeFeaturedGridProps {
  latest: Project[];
  featured: Project[];
}

export function HomeFeaturedGrid({ latest, featured }: HomeFeaturedGridProps) {
  const { locale, dict } = useI18n();
  const isEn = locale === "en";

  return (
    <>
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
                {isEn ? (
                  <>
                    Latest <em className="italic">Launches.</em>
                  </>
                ) : (
                  dict.home.latestLaunchesHeading
                )}
              </h2>
              <p className="mt-2 text-sm text-muted">{dict.home.latestLaunchesBody}</p>
            </div>
            <LocaleLink
              href="/projects"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {dict.home.seeAll}
            </LocaleLink>
          </div>
          {/* No priorityImage here — homepage LCP is only the full-bleed hero (#187). */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((project, index) => (
              <ShowcaseProjectCard
                index={index}
                key={project.id}
                project={project}
              />
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="bg-surface-darker py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
                {isEn ? (
                  <>
                    Featured <em className="italic text-brand-light">Projects.</em>
                  </>
                ) : (
                  dict.home.featuredProjectsHeading
                )}
              </h2>
              <LocaleLink
                href="/projects"
                className="iop-btn-press focus-ring rounded-full text-sm font-semibold text-brand-light hover:text-white"
              >
                {dict.common.viewAll}
              </LocaleLink>
            </div>
            {/* 1 hero + 4 support — layout only; no fetchpriority=high under the page hero */}
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ShowcaseProjectCard
                  project={featured[0]}
                  featured
                  dark
                  index={0}
                />
              </div>
              {featured.slice(1, 5).map((project, i) => (
                <ShowcaseProjectCard key={project.id} project={project} dark index={i + 1} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
