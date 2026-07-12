"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SortSelect } from "@/components/sort-select";
import { DeveloperProjectCard } from "@/components/developer-project-card";
import { Pagination } from "@/components/pagination";
import { sortDeveloperProjects } from "@/lib/developer-utils";
import { useI18n } from "@/i18n/locale-provider";
import {
  DEVELOPER_PAGE_SIZE,
  type DeveloperProjectCardData,
  type SortOption,
} from "@/lib/types";

const SORT_OPTIONS: readonly SortOption[] = [
  "featured",
  "price-asc",
  "price-desc",
  "value-asc",
  "handover-asc",
  "handover-desc",
];

function isSortOption(value: string | null): value is SortOption {
  return value != null && (SORT_OPTIONS as readonly string[]).includes(value);
}

interface DeveloperProjectsBrowserProps {
  /**
   * Card-only rows for this developer (no PDP fields / unit arrays). Sorted +
   * paginated client-side so the route stays ISR-static.
   */
  projects: DeveloperProjectCardData[];
  heading: string;
  countLabel: string;
}

/**
 * Client-side sort + pagination for a developer's project grid. Receives a
 * slim card projection (not full Project) so large developers stay under the
 * multi-MB RSC payload budget. No `searchParams` on the server — URL sync is
 * shallow via `history.replaceState`.
 *
 * Default state ("featured", page 1) still SSRs first-page cards for SEO/LCP.
 */
export function DeveloperProjectsBrowser({
  projects,
  heading,
  countLabel,
}: DeveloperProjectsBrowserProps) {
  const { dict } = useI18n();
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  // Restore state from a shared/bookmarked URL after mount. Done in an effect
  // (not `useSearchParams`) so the server render — and thus the first-page
  // cards — stay static instead of bailing to client-side rendering.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSort = params.get("sort");
    if (isSortOption(urlSort)) setSort(urlSort);
    const urlPage = Number(params.get("page"));
    if (Number.isFinite(urlPage) && urlPage > 1) setPage(Math.floor(urlPage));
  }, []);

  const sorted = useMemo(
    () => sortDeveloperProjects(projects, sort),
    [projects, sort],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / DEVELOPER_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * DEVELOPER_PAGE_SIZE,
    currentPage * DEVELOPER_PAGE_SIZE,
  );

  function syncUrl(nextSort: SortOption, nextPage: number) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (nextSort === "featured") params.delete("sort");
    else params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    const qs = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  }

  function onSortChange(nextSort: SortOption) {
    setSort(nextSort);
    setPage(1);
    syncUrl(nextSort, 1);
  }

  function onPageChange(nextPage: number) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPage(clamped);
    syncUrl(sort, clamped);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} aria-labelledby="developer-projects-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="developer-projects-heading"
            className="font-display text-3xl font-semibold text-text-dark md:text-4xl"
          >
            {heading}
          </h1>
          <p className="mt-2 text-sm font-medium text-muted">{countLabel}</p>
        </div>
        <SortSelect value={sort} onChange={onSortChange} />
      </div>

      {pageItems.length === 0 ? (
        <p className="mt-10 text-muted">{dict.developers.noListings}</p>
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

      <Pagination page={currentPage} totalPages={totalPages} onChange={onPageChange} />
    </section>
  );
}
