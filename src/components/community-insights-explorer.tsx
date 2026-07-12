"use client";

import { useMemo, useState } from "react";
import { LocaleLink } from "@/components/locale-link";
import { communitySlugFor } from "@/lib/community-slug";
import type { CommunityInsightArea } from "@/lib/community-insights-shared";
import {
  LIFESTYLE_CATEGORIES,
  type LifestyleSlug,
} from "@/lib/community-lifestyles";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface CommunityInsightsExplorerProps {
  areas: CommunityInsightArea[];
}

export function CommunityInsightsExplorer({ areas }: CommunityInsightsExplorerProps) {
  const { dict } = useI18n();
  const t = dict.tools.communityInsightsExplorer;
  const lifestyles = dict.lifestyles;
  const [lifestyle, setLifestyle] = useState<LifestyleSlug | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = areas;
    if (lifestyle !== "all") {
      list = list.filter((a) => a.lifestyles.includes(lifestyle));
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    return list;
  }, [areas, lifestyle, query]);

  function lifestyleCopy(slug: LifestyleSlug) {
    return lifestyles[slug];
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="iop-input max-w-md"
        />
        <p className="text-sm text-muted">
          {filtered.length === 1
            ? interpolate(t.countSingular, { count: filtered.length })
            : interpolate(t.countPlural, { count: filtered.length })}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <LifestyleChip
          active={lifestyle === "all"}
          onClick={() => setLifestyle("all")}
          label={lifestyles.all}
        />
        {LIFESTYLE_CATEGORIES.map((cat) => {
          const copy = lifestyleCopy(cat.slug);
          return (
            <LifestyleChip
              key={cat.slug}
              active={lifestyle === cat.slug}
              onClick={() => setLifestyle(cat.slug)}
              label={`${cat.emoji} ${copy.label}`}
            />
          );
        })}
      </div>

      {lifestyle !== "all" ? (
        <p className="mt-4 text-sm text-muted">
          {lifestyleCopy(lifestyle).description}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((area) => (
          <LocaleLink
            key={area.slug}
            href={`/communities/${communitySlugFor(area.name)}`}
            className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-text-dark group-hover:text-brand">
                  {area.name}
                </h3>
                <p className="text-xs text-muted">{area.cityLabel}</p>
              </div>
              <span className="rounded-full bg-brand-muted px-2.5 py-1 text-xs font-semibold text-brand">
                {area.projectCount}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">
              {interpolate(t.unitOptions, { count: area.unitCount })}
              {area.minPriceAed > 0
                ? ` · ${interpolate(t.fromPrice, {
                    price: formatPrice(area.minPriceAed, "AED", { compact: true }),
                  })}`
                : ` · ${t.priceOnRequest}`}
            </p>
            {area.grossYieldPct != null || area.medianSoldPpsqft != null ? (
              <p className="mt-1 text-xs font-medium text-brand">
                {t.dldLine}
                {area.grossYieldPct != null
                  ? ` ${interpolate(t.grossYield, { value: area.grossYieldPct })}`
                  : ""}
                {area.grossYieldPct != null && area.medianSoldPpsqft != null ? " ·" : ""}
                {area.medianSoldPpsqft != null
                  ? ` ${interpolate(t.soldPsf, {
                      value: area.medianSoldPpsqft.toLocaleString(),
                    })}`
                  : ""}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {area.lifestyles.slice(0, 3).map((tag) => {
                const cat = LIFESTYLE_CATEGORIES.find((c) => c.slug === tag);
                const copy = lifestyleCopy(tag);
                return (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-muted"
                  >
                    {cat?.emoji} {copy.label}
                  </span>
                );
              })}
            </div>
          </LocaleLink>
        ))}
      </div>
    </div>
  );
}

function LifestyleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-white text-muted hover:border-brand hover:text-brand",
      )}
    >
      {label}
    </button>
  );
}
