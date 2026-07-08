"use client";

import Link from "next/link";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import type { Project } from "@/lib/types";

interface HomeFeaturedGridProps {
  latest: Project[];
  featured: Project[];
}

export function HomeFeaturedGrid({ latest, featured }: HomeFeaturedGridProps) {
  return (
    <>
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
                Latest <em className="italic">Launches.</em>
              </h2>
              <p className="mt-2 text-sm text-muted">
                New off-plan inventory with brochures and unit-level pricing.
              </p>
            </div>
            <Link
              href="/projects"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              See all →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((project, index) => (
              <ShowcaseProjectCard
                index={index}
                key={project.id}
                project={project}
                priorityImage={index === 0}
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
                Featured <em className="italic text-brand-light">Projects.</em>
              </h2>
              <Link
                href="/projects"
                className="iop-btn-press focus-ring rounded-full text-sm font-semibold text-brand-light hover:text-white"
              >
                View All →
              </Link>
            </div>
            {/* 1 hero + 4 support — a bento rhythm break, not two full-width slabs */}
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ShowcaseProjectCard
                  project={featured[0]}
                  featured
                  dark
                  index={0}
                  priorityImage
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