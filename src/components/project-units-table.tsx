import {
  bedsLabel,
  formatSqft,
  propertyTypeLabel,
} from "@/lib/format";
import { LaunchPrice } from "@/components/currency-price";
import { hasPaymentPlan } from "@/lib/investment-metrics";
import type { Project, UnitType } from "@/lib/types";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

interface ProjectUnitsTableProps {
  units: UnitType[];
  project: Project;
  locale?: Locale;
}

export function ProjectUnitsTable({ units, project, locale = "en" }: ProjectUnitsTableProps) {
  const dict = getDictionary(locale);
  const u = dict.pdp.units;
  const planLabel = hasPaymentPlan(project.paymentPlan)
    ? project.paymentPlan.trim()
    : null;
  return (
    <>
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-white md:block">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border bg-surface-alt text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{u.colBeds}</th>
              <th className="px-4 py-3 font-medium">{u.colSize}</th>
              <th className="px-4 py-3 font-medium">{u.colType}</th>
              <th className="px-4 py-3 font-medium">{u.colFrom}</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-dark">{bedsLabel(unit.beds, dict)}</td>
                <td className="px-4 py-3 text-muted">
                  {formatSqft(unit.sqftMin, unit.sqftMax)}
                </td>
                <td className="px-4 py-3 capitalize text-muted">{propertyTypeLabel(unit.propertyType, dict, locale)}</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-brand">
                  <LaunchPrice
                    minAed={unit.launchPriceAed}
                    maxAed={unit.launchPriceMaxAed}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {units.map((unit) => (
          <article
            key={unit.id}
            className="rounded-xl border border-border bg-white p-4 shadow-elevation-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-text-dark">
                  {bedsLabel(unit.beds, dict)} · {propertyTypeLabel(unit.propertyType, dict, locale)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatSqft(unit.sqftMin, unit.sqftMax)}
                </p>
              </div>
              <p className="shrink-0 text-end font-semibold text-brand">
                <LaunchPrice
                  minAed={unit.launchPriceAed}
                  maxAed={unit.launchPriceMaxAed}
                />
              </p>
            </div>
            {planLabel ? (
              <p className="mt-2 text-xs text-muted">{planLabel}</p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}