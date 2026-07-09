"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommunityInsightArea } from "@/lib/community-insights-shared";
import {
  LIFESTYLE_CATEGORIES,
  type LifestyleSlug,
} from "@/lib/community-lifestyles";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CommunityInsightsExplorerProps {
  areas: CommunityInsightArea[];
}

export function CommunityInsightsExplorer({ areas }: CommunityInsightsExplorerProps) {
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

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search communities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="iop-input max-w-md"
        />
        <p className="text-sm text-muted">
          {filtered.length} communit{filtered.length === 1 ? "y" : "ies"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <LifestyleChip
          active={lifestyle === "all"}
          onClick={() => setLifestyle("all")}
          label="All lifestyles"
        />
        {LIFESTYLE_CATEGORIES.map((cat) => (
          <LifestyleChip
            key={cat.slug}
            active={lifestyle === cat.slug}
            onClick={() => setLifestyle(cat.slug)}
            label={`${cat.emoji} ${cat.label}`}
          />
        ))}
      </div>

      {lifestyle !== "all" ? (
        <p className="mt-4 text-sm text-muted">
          {LIFESTYLE_CATEGORIES.find((c) => c.slug === lifestyle)?.description}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((area) => (
          <Link
            key={area.slug}
            href={`/areas/${area.slug}`}
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
              {area.unitCount} unit options · from{" "}
              {formatPrice(area.minPriceAed, "AED", { compact: true })}
            </p>
            {area.grossYieldPct != null || area.medianSoldPpsqft != null ? (
              <p className="mt-1 text-xs font-medium text-brand">
                DLD 2025:
                {area.grossYieldPct != null ? ` ${area.grossYieldPct}% gross yield` : ""}
                {area.grossYieldPct != null && area.medianSoldPpsqft != null ? " ·" : ""}
                {area.medianSoldPpsqft != null
                  ? ` AED ${area.medianSoldPpsqft.toLocaleString()}/sqft sold`
                  : ""}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {area.lifestyles.slice(0, 3).map((tag) => {
                const cat = LIFESTYLE_CATEGORIES.find((c) => c.slug === tag);
                return (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-muted"
                  >
                    {cat?.emoji} {cat?.label ?? tag}
                  </span>
                );
              })}
            </div>
          </Link>
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