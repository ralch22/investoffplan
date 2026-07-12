"use client";

import { useState } from "react";
import Link from "next/link";
import { Gate } from "@/components/auth/gate";
import { TrendChart } from "@/components/trend-chart";
import type { DldAreaStats } from "@/lib/dld-area-stats";
import { bedKeyLabel, formatPrice } from "@/lib/format";
import { useI18n } from "@/i18n/locale-provider";

interface DeepAnalyticsResponse {
  community: { slug: string; name: string };
  stats: DldAreaStats;
  source: string;
  sourcePeriod: string;
}

interface Props {
  slug: string;
  areaName: string;
  /** Link to the printable market report page (EN-only route), if covered. */
  reportHref?: string;
}

/**
 * Deep-analytics expander under the DLD stats band. The static HTML is
 * identical for every visitor: it only ever contains the unlock button and
 * report link. The full dataset (complete monthly series incl. thin months +
 * per-bed detail) is fetched from the session-guarded /api/me/analytics
 * endpoint ON CLICK — signed-out clicks open the sign-in modal (Gate) and the
 * fetch auto-resumes after sign-in.
 */
export function DeepAnalyticsUnlock({ slug, areaName, reportHref }: Props) {
  const { dict } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "loaded">(
    "idle",
  );
  const [data, setData] = useState<DeepAnalyticsResponse | null>(null);

  async function load() {
    if (status === "loading" || status === "loaded") return;
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/me/analytics/community/${encodeURIComponent(slug)}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as DeepAnalyticsResponse;
      setData(body);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  const trend = data?.stats.monthlyTrend ?? [];

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
      {status !== "loaded" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text-dark">
              {dict.reports.unlockTrend}
            </p>
            <p className="mt-0.5 text-xs text-muted">{dict.reports.unlockHint}</p>
            {status === "error" ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {dict.reports.unlockError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Gate context="deep-analytics" onAllowed={() => void load()}>
              <button
                type="button"
                disabled={status === "loading"}
                className="iop-btn-press focus-ring rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {status === "loading"
                  ? dict.reports.unlockLoading
                  : dict.reports.unlockTrend}
              </button>
            </Gate>
            {reportHref ? (
              <Link
                href={reportHref}
                className="iop-btn-press focus-ring rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
              >
                {dict.reports.downloadReport}
              </Link>
            ) : null}
          </div>
        </div>
      ) : data ? (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {dict.reports.fullTrendTitle} · {areaName}
            </p>
            {reportHref ? (
              <Link
                href={reportHref}
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                {dict.reports.downloadReport}
              </Link>
            ) : null}
          </div>

          {trend.length >= 2 ? (
            <TrendChart
              className="mt-3"
              height={128}
              ariaLabel={`${dict.reports.fullTrendTitle} — ${areaName}`}
              points={trend.map((t) => ({
                label: t.month.slice(5, 7),
                value: t.medianPpsqft,
                title: `${t.month}: AED ${t.medianPpsqft.toLocaleString()}/sqft · ${t.n}`,
              }))}
            />
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="text-xs text-muted-light">
                  <th className="px-3 py-1.5 text-start font-medium">
                    {dict.reports.monthCol}
                  </th>
                  <th className="px-3 py-1.5 text-end font-medium">
                    {dict.reports.ppsqftCol}
                  </th>
                  <th className="px-3 py-1.5 text-end font-medium">
                    {dict.reports.salesCol}
                  </th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t) => (
                  <tr key={t.month} className="border-t border-border">
                    <td className="px-3 py-1.5 font-medium tabular-nums text-text-dark">
                      {t.month}
                    </td>
                    <td className="px-3 py-1.5 text-end tabular-nums text-text-dark">
                      AED {t.medianPpsqft.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-end tabular-nums text-muted">
                      {t.n.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.stats.beds && Object.keys(data.stats.beds).length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {dict.reports.bedTitle}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-light">
                      <th className="px-3 py-1.5 text-start font-medium">
                        {dict.reports.typeCol}
                      </th>
                      <th className="px-3 py-1.5 text-end font-medium">
                        {dict.reports.priceCol}
                      </th>
                      <th className="px-3 py-1.5 text-end font-medium">
                        {dict.reports.ppsqftCol}
                      </th>
                      <th className="px-3 py-1.5 text-end font-medium">
                        {dict.reports.salesCol}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.stats.beds)
                      .sort(([x], [y]) => Number(x) - Number(y))
                      .map(([k, v]) => (
                        <tr key={k} className="border-t border-border">
                          <td className="px-3 py-1.5 font-medium text-text-dark">
                            {bedKeyLabel(k, dict)}
                          </td>
                          <td className="px-3 py-1.5 text-end tabular-nums text-text-dark">
                            {v.medianPrice != null
                              ? formatPrice(Math.round(v.medianPrice), "AED")
                              : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-end tabular-nums text-muted">
                            {v.medianPpsqft != null
                              ? `AED ${v.medianPpsqft.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-end tabular-nums text-muted-light">
                            {v.n.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

