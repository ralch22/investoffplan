"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DeveloperProjectCard } from "@/components/developer-project-card";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { sortDeveloperProjects } from "@/lib/developer-utils";
import { DEVELOPER_PAGE_SIZE, type Project, type SortOption } from "@/lib/types";

interface DeveloperProjectsSectionProps {
  developerName: string;
  projects: Project[];
  catalogProjectCount: number;
  portfolioProjectCount?: number;
}

export function DeveloperProjectsSection({
  developerName,
  projects,
  catalogProjectCount,
  portfolioProjectCount,
}: DeveloperProjectsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = (searchParams.get("sort") as SortOption | null) ?? "featured";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const sorted = useMemo(
    () => sortDeveloperProjects(projects, sort),
    [projects, sort],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / DEVELOPER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * DEVELOPER_PAGE_SIZE,
    currentPage * DEVELOPER_PAGE_SIZE,
  );

  function updateParams(next: { sort?: SortOption; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sort != null) {
      if (next.sort === "featured") params.delete("sort");
      else params.set("sort", next.sort);
      params.delete("page");
    }
    if (next.page != null) {
      if (next.page <= 1) params.delete("page");
      else params.set("page", String(next.page));
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  const countLabel =
    portfolioProjectCount && portfolioProjectCount > catalogProjectCount
      ? `${catalogProjectCount.toLocaleString()} projects on invest off-plan · ${portfolioProjectCount.toLocaleString()} in developer portfolio`
      : `${catalogProjectCount.toLocaleString()} project${catalogProjectCount === 1 ? "" : "s"}`;

  return (
    <section aria-labelledby="developer-projects-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="developer-projects-heading"
            className="font-display text-3xl font-semibold text-text-dark md:text-4xl"
          >
            New &amp; Off-Plan Projects by {developerName}
          </h1>
          <p className="mt-2 text-sm font-medium text-muted">{countLabel}</p>
        </div>
        <SortSelect value={sort} onChange={(nextSort) => updateParams({ sort: nextSort })} />
      </div>

      {pageItems.length === 0 ? (
        <p className="mt-10 text-muted">
          No listings for this developer right now. Check back soon or contact our team.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((project, index) => (
            <DeveloperProjectCard
              key={project.id}
              project={project}
              priorityImage={currentPage === 1 && index < 4}
            />
          ))}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={(nextPage) => updateParams({ page: nextPage })}
      />
    </section>
  );
}