"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CityChips } from "@/components/city-chips";
import { DeveloperLogo } from "@/components/developer-logo";
import { Pagination } from "@/components/pagination";
import { DEVELOPER_PAGE_SIZE, type DeveloperSummary } from "@/lib/types";
import { developerDescription } from "@/lib/developer-utils";
import type { CitySlug } from "@/lib/types";

interface DeveloperCityCount {
  slug: CitySlug;
  label: string;
  count: number;
}

interface DevelopersDirectoryProps {
  developers: DeveloperSummary[];
  cityCounts: DeveloperCityCount[];
}

export function DevelopersDirectory({
  developers,
  cityCounts,
}: DevelopersDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const city = (searchParams.get("city") as CitySlug | null) ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const cityOptions = useMemo(
    () => [
      { slug: "all" as CitySlug, label: "All UAE", count: developers.length },
      ...cityCounts,
    ],
    [cityCounts, developers.length],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return developers.filter((dev) => {
      if (city !== "all" && !dev.cities.includes(city)) return false;
      if (!q) return true;
      return dev.name.toLowerCase().includes(q);
    });
  }, [city, developers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DEVELOPER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * DEVELOPER_PAGE_SIZE,
    currentPage * DEVELOPER_PAGE_SIZE,
  );

  function updateParams(next: { city?: CitySlug; page?: number; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.city != null) {
      if (next.city === "all") params.delete("city");
      else params.set("city", next.city);
      params.delete("page");
    }
    if (next.page != null) {
      if (next.page <= 1) params.delete("page");
      else params.set("page", String(next.page));
    }
    if (next.q != null) {
      if (!next.q.trim()) params.delete("q");
      else params.set("q", next.q.trim());
      params.delete("page");
    }
    const qs = params.toString();
    router.replace(qs ? `/developers?${qs}` : "/developers", { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted">
          {filtered.length.toLocaleString()} developer
          {filtered.length === 1 ? "" : "s"}
        </p>
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Search developers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              updateParams({ q: event.target.value });
            }}
            placeholder="Search developers"
            className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-dark placeholder:text-muted-light"
          />
        </label>
      </div>

      <div className="mt-6">
        <CityChips
          cities={cityOptions}
          value={city}
          onChange={(nextCity) => updateParams({ city: nextCity })}
        />
      </div>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-white">
        {pageItems.map((dev) => (
          <li key={dev.slug} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6">
            <DeveloperLogo
              name={dev.name}
              logoUrl={dev.logoUrl}
              slug={dev.slug}
              size="xl"
              link
              className="border border-border shadow-sm"
            />
            <div className="min-w-0 flex-1">
              {dev.foundedYear ? (
                <p className="text-sm text-muted">Founded in {dev.foundedYear}</p>
              ) : null}
              <h3 className="mt-1 text-xl font-semibold text-text-dark">
                <Link href={`/developers/${dev.slug}`} className="hover:text-brand">
                  {dev.name}
                </Link>
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {developerDescription(dev.slug, dev.description)}
              </p>
              <p className="mt-2 text-xs text-muted-light">
                {dev.projectCount} project{dev.projectCount === 1 ? "" : "s"} ·{" "}
                {dev.unitCount.toLocaleString()} unit options
              </p>
            </div>
            <Link
              href={`/developers/${dev.slug}`}
              className="iop-btn-press focus-ring shrink-0 self-start rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              Show projects
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted">No developers match your filters.</p>
      ) : null}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={(nextPage) => updateParams({ page: nextPage })}
      />
    </div>
  );
}