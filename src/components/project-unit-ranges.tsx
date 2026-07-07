import { formatBeds, formatSqft } from "@/lib/format";
import type { UnitType } from "@/lib/types";

interface ProjectUnitRangesProps {
  units: UnitType[];
}

export function ProjectUnitRanges({ units }: ProjectUnitRangesProps) {
  const groups = new Map<
    string,
    { beds: number; propertyType: string; sqftMin: number; sqftMax: number }
  >();

  for (const unit of units) {
    const key = `${unit.beds}-${unit.propertyType}`;
    const existing = groups.get(key);
    const maxSqft = unit.sqftMax ?? unit.sqftMin;
    if (!existing) {
      groups.set(key, {
        beds: unit.beds,
        propertyType: unit.propertyType,
        sqftMin: unit.sqftMin,
        sqftMax: maxSqft,
      });
      continue;
    }
    existing.sqftMin = Math.min(existing.sqftMin, unit.sqftMin);
    existing.sqftMax = Math.max(existing.sqftMax, maxSqft);
  }

  const rows = [...groups.values()].sort((a, b) => a.beds - b.beds);

  if (rows.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-light">
        Unit type sizes
      </h3>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={`${row.beds}-${row.propertyType}`} className="text-sm text-text-dark">
            <span className="font-semibold capitalize">
              {formatBeds(row.beds)} {row.propertyType}s
            </span>
            {" — sizes "}
            {row.sqftMin === row.sqftMax
              ? formatSqft(row.sqftMin)
              : `${formatSqft(row.sqftMin)} to ${formatSqft(row.sqftMax)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}