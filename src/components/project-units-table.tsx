import {
  formatBeds,
  formatLaunchPrice,
  formatSqft,
} from "@/lib/format";
import type { Project, UnitType } from "@/lib/types";

interface ProjectUnitsTableProps {
  units: UnitType[];
  project: Project;
}

export function ProjectUnitsTable({ units, project }: ProjectUnitsTableProps) {
  return (
    <>
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-white md:block">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border bg-surface-alt text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Beds</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">From</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-dark">{formatBeds(unit.beds)}</td>
                <td className="px-4 py-3 text-muted">
                  {formatSqft(unit.sqftMin, unit.sqftMax)}
                </td>
                <td className="px-4 py-3 capitalize text-muted">{unit.propertyType}</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-brand">
                  {formatLaunchPrice(
                    unit.launchPriceAed,
                    unit.launchPriceMaxAed,
                    "AED",
                  )}
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
                  {formatBeds(unit.beds)} · {unit.propertyType}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatSqft(unit.sqftMin, unit.sqftMax)}
                </p>
              </div>
              <p className="shrink-0 text-end font-semibold text-brand">
                {formatLaunchPrice(
                  unit.launchPriceAed,
                  unit.launchPriceMaxAed,
                  "AED",
                )}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted">{project.paymentPlan}</p>
          </article>
        ))}
      </div>
    </>
  );
}