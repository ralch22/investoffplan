"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CityChips } from "@/components/city-chips";
import { DevelopersList } from "@/components/developers-list";
import { Pagination } from "@/components/pagination";
import { DEVELOPER_PAGE_SIZE, type DeveloperSummary } from "@/lib/types";
import type { CitySlug } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";

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
  const { dict, locale } = useI18n();
  const t = dict.pages.developers;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const city = (searchParams.get("city") as CitySlug | null) ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const cityOptions = useMemo(
    () => [
      { slug: "all" as CitySlug, label: t.allUae, count: developers.length },
      ...cityCounts,
    ],
    [cityCounts, developers.length, t.allUae],
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
    // Keep AR filter/search/pagination under /ar/developers (not bare EN).
    const base = localePath(locale, "/developers");
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted">
          {filtered.length === 1
            ? interpolate(t.countSingular, { count: filtered.length.toLocaleString() })
            : interpolate(t.countPlural, { count: filtered.length.toLocaleString() })}
        </p>
        <label className="relative w-full max-w-sm">
          <span className="sr-only">{t.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              updateParams({ q: event.target.value });
            }}
            placeholder={t.searchPlaceholder}
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

      <DevelopersList items={pageItems} />

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted">{t.emptyState}</p>
      ) : null}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={(nextPage) => updateParams({ page: nextPage })}
      />
    </div>
  );
}