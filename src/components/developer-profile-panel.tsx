"use client";

import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type {
  DeveloperProfile,
  MarketPositioning,
  SubMetricKey,
} from "@/lib/developer-score";

interface DeveloperProfilePanelProps {
  developerName: string;
  profile: DeveloperProfile;
}

const POSITIONING_ORDER: MarketPositioning[] = ["value", "mid-market", "premium"];

const bandKey = (band: MarketPositioning): "value" | "midMarket" | "premium" =>
  band === "mid-market" ? "midMarket" : band;

/**
 * Data-derived Developer PROFILE panel — NOT a quality/delivery rating.
 * Server-rendered (indexable) via the shared developer page; localized through
 * the locale context so EN and AR read from the same dict shape. All numbers
 * arrive precomputed from the server (own catalog + 2025 DLD); this component
 * only formats and discloses them.
 */
export function DeveloperProfilePanel({
  developerName,
  profile,
}: DeveloperProfilePanelProps) {
  const { dict } = useI18n();
  const t = dict.developers.profile;
  const { subMetrics, inputs, weights } = profile;

  const bars: Array<{
    key: SubMetricKey;
    label: string;
    hint: string;
    score: number;
  }> = [
    {
      key: "portfolioScale",
      label: t.metrics.portfolioScale,
      hint: interpolate(t.metricHints.portfolioScale, {
        count: subMetrics.portfolioScale.projectCount.toLocaleString(),
      }),
      score: subMetrics.portfolioScale.score,
    },
    {
      key: "geographicReach",
      label: t.metrics.geographicReach,
      hint: interpolate(t.metricHints.geographicReach, {
        count: subMetrics.geographicReach.communityCount.toLocaleString(),
      }),
      score: subMetrics.geographicReach.score,
    },
    {
      key: "buyerTerms",
      label: t.metrics.buyerTerms,
      hint: interpolate(t.metricHints.buyerTerms, {
        count: subMetrics.buyerTerms.postHandoverProjects,
        total: subMetrics.buyerTerms.totalProjects,
      }),
      score: subMetrics.buyerTerms.score,
    },
  ];

  const positioning = subMetrics.marketPositioning;

  return (
    <section
      aria-labelledby="developer-profile-heading"
      className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="developer-profile-heading"
            className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
          >
            {t.heading}
            <span className="sr-only"> — {developerName}</span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t.subtitle}</p>
        </div>
        <div className="w-full text-end sm:w-auto sm:shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-light">
            {t.tierLabel}
          </p>
          <p className="mt-1 flex items-baseline justify-end gap-2">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
              {t.tiers[profile.tier]}
            </span>
            <span className="text-2xl font-semibold tabular-nums text-text-dark">
              {profile.composite}
              <span className="text-base font-medium text-muted-light">/100</span>
            </span>
          </p>
          <p className="mt-1 ms-auto max-w-[240px] text-[11px] text-muted-light">{t.notRanking}</p>
        </div>
      </div>

      {/* Load-bearing disclaimer kept ALWAYS VISIBLE (not only in the collapsed
          methodology panel) — the score/tier are size descriptors, never a
          quality/delivery/financial rating. */}
      <p className="mt-4 rounded-lg border border-border/70 bg-surface-alt/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
        {t.disclaimer}
      </p>

      <div className="mt-8 space-y-5">
        {bars.map((bar) => (
          <div key={bar.key} data-profile-metric={bar.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-text-dark">
                {bar.label}
              </span>
              <span className="text-xs text-muted">{bar.hint}</span>
            </div>
            <div
              role="meter"
              aria-valuenow={bar.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={bar.label}
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-alt"
            >
              <div
                className="h-full rounded-full bg-brand/85 transition-all duration-500"
                style={{ width: `${Math.max(2, bar.score)}%` }}
              />
            </div>
          </div>
        ))}

        {/* Market positioning — a value↔premium spectrum, NOT a better/worse
            bar. The active band is highlighted; nothing here implies quality. */}
        <div data-profile-metric="marketPositioning">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-text-dark">
              {t.metrics.marketPositioning}
            </span>
            <span className="text-xs text-muted">
              {t.metricHints.marketPositioning}
            </span>
          </div>
          {positioning ? (
            <>
              <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label={t.metrics.marketPositioning}>
                {POSITIONING_ORDER.map((band) => {
                  const active = positioning.band === band;
                  return (
                    <div
                      key={band}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition",
                        active
                          ? "bg-brand text-white shadow-sm"
                          : "bg-surface-alt text-muted-light",
                      )}
                    >
                      {t.positioning[bandKey(band)]}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-light">
                {t.positioningNote}
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-muted-light">
              {t.positioningUnavailable}
            </p>
          )}
        </div>
      </div>

      <details className="group mt-8 rounded-xl border border-border bg-surface-alt/60 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-text-dark [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-brand transition group-open:rotate-90">›</span>
            {t.methodologyToggle}
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted">
          <p>{t.methodologyIntro}</p>
          <ul className="list-disc space-y-1.5 ps-5">
            <li>
              {interpolate(t.inputs.scale, {
                count: inputs.projectCount.toLocaleString(),
              })}
            </li>
            <li>
              {interpolate(t.inputs.reach, {
                count: inputs.communityCount.toLocaleString(),
              })}
            </li>
            <li>
              {interpolate(t.inputs.terms, {
                count: inputs.postHandoverProjects,
                total: inputs.projectCount,
              })}
            </li>
            <li>
              {positioning && inputs.devMedianPpsqft != null && inputs.marketMedianPpsqft != null
                ? interpolate(t.inputs.positioning, {
                    devMedian: inputs.devMedianPpsqft.toLocaleString(),
                    marketMedian: inputs.marketMedianPpsqft.toLocaleString(),
                    areas: inputs.areasWithDldData.toLocaleString(),
                  })
                : t.inputs.positioningNone}
            </li>
            <li>
              {interpolate(t.inputs.composite, {
                scaleW: Math.round(weights.portfolioScale * 100),
                reachW: Math.round(weights.geographicReach * 100),
                termsW: Math.round(weights.buyerTerms * 100),
                positioningW: Math.round(weights.marketPositioning * 100),
              })}
            </li>
          </ul>
          <p className="font-medium text-text-dark">{t.disclaimer}</p>
          <p className="text-muted-light">{t.source}</p>
        </div>
      </details>
    </section>
  );
}
