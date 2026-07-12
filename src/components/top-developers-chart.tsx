"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/locale-link";
import { DeveloperLogo } from "@/components/developer-logo";
import type { DeveloperSummary } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/locale-provider";

type Metric = "units" | "projects";

interface TopDevelopersChartProps {
  developers: DeveloperSummary[];
}

export function TopDevelopersChart({ developers }: TopDevelopersChartProps) {
  const { dict } = useI18n();
  const t = dict.pages.topDevelopers;
  const [metric, setMetric] = useState<Metric>("units");
  const top = [...developers]
    .sort((a, b) =>
      metric === "units"
        ? b.unitCount - a.unitCount
        : b.projectCount - a.projectCount,
    )
    .slice(0, 5);

  const maxValue = Math.max(
    ...top.map((dev) => (metric === "units" ? dev.unitCount : dev.projectCount)),
    1,
  );

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {metric === "units" ? t.rankedByUnits : t.rankedByProjects}
          </p>
        </div>
        <div
          className="inline-flex rounded-full border border-border bg-surface p-1"
          role="group"
          aria-label={dict.a11y.chartMetric}
        >
          {(
            [
              { id: "units" as const, label: t.byUnits },
              { id: "projects" as const, label: t.byProjects },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMetric(option.id)}
              aria-pressed={metric === option.id}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                metric === option.id
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-text-dark",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {top.map((dev, index) => {
          const value = metric === "units" ? dev.unitCount : dev.projectCount;
          const width = `${Math.max(8, (value / maxValue) * 100)}%`;

          return (
            <div key={dev.slug} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,220px)_1fr_auto] md:items-center">
              <LocaleLink
                href={`/developers/${dev.slug}`}
                className="flex min-w-0 items-center gap-3 transition hover:opacity-80"
              >
                <DeveloperLogo
                  name={dev.name}
                  logoUrl={dev.logoUrl}
                  slug={dev.slug}
                  size="sm"
                />
                <span className="truncate font-semibold text-text-dark">{dev.name}</span>
              </LocaleLink>
              <div className="relative h-8 overflow-hidden rounded-lg bg-surface-alt">
                <div
                  className="absolute inset-y-0 start-0 rounded-lg bg-brand/85 transition-all duration-500"
                  style={{ width }}
                />
                <span className="relative z-10 flex h-full items-center px-3 text-xs font-semibold text-white mix-blend-difference">
                  #{index + 1}
                </span>
              </div>
              <p className="text-end text-sm font-semibold tabular-nums text-text-dark md:min-w-16">
                {value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}