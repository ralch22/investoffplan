"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/locale-provider";
import { localePath } from "@/i18n/config";
import { bedsLabel, formatPrice } from "@/lib/format";
import type { AdvisorCard } from "@/lib/advisor/types";

/**
 * A2UI `CompareTable` leaf — rendered instead of a stack of cards when the user
 * explicitly asked to compare two grounded projects. Purely presentational over
 * the same AdvisorCard fields, so it can never show a project the tools didn't
 * return.
 *
 * Links out to the compare hub rather than a `/compare-projects/{a}-vs-{b}`
 * pair URL: those routes are `dynamicParams = false`, so an un-prerendered pair
 * would hard-404.
 */
export function AdvisorCompareTable({ projects }: { projects: AdvisorCard[] }) {
  const { locale, dict } = useI18n();
  const t = dict.advisor;
  const pair = projects.slice(0, 2);
  if (pair.length < 2) return null;

  const rows: Array<{ label: string; value: (c: AdvisorCard) => string }> = [
    { label: t.compareDeveloper, value: (c) => c.developer || "—" },
    { label: t.compareArea, value: (c) => c.area || "—" },
    {
      label: t.compareFrom,
      value: (c) =>
        typeof c.fromPriceAed === "number"
          ? formatPrice(c.fromPriceAed, "AED", { compact: true })
          : "—",
    },
    { label: t.compareHandover, value: (c) => c.handover || "—" },
    {
      label: t.compareBeds,
      value: (c) =>
        c.beds?.length ? c.beds.map((n) => bedsLabel(n, dict)).join("–") : "—",
    },
    { label: t.comparePlan, value: (c) => c.paymentPlan || "—" },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <p className="border-b border-border px-4 py-3 text-sm font-semibold text-text-dark">
        {t.compareTitle}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th scope="col" className="p-3 text-start font-medium text-muted" />
              {pair.map((c) => (
                <th key={c.slug} scope="col" className="p-3 text-start">
                  <Link
                    href={localePath(locale, `/projects/${c.slug}`)}
                    className="focus-ring rounded-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    {c.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <th scope="row" className="p-3 text-start font-medium text-muted">
                  {row.label}
                </th>
                {pair.map((c) => (
                  <td key={c.slug} className="p-3 text-text-dark">
                    {row.value(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3">
        <Link
          href={localePath(locale, "/compare-projects")}
          className="focus-ring inline-block rounded-sm text-xs font-semibold text-brand hover:text-brand-dark"
        >
          {t.compareOpen} →
        </Link>
      </div>
    </div>
  );
}
