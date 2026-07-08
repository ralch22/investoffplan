"use client";

import { useMemo, useState } from "react";
import { PaymentCalculator } from "@/components/payment-calculator";
import { formatBeds, formatPrice, formatSqft } from "@/lib/format";
import type { Project, UnitType } from "@/lib/types";

interface ProjectPaymentCalculatorProps {
  project: Project;
}

function unitLabel(unit: UnitType): string {
  const parts = [
    formatBeds(unit.beds),
    unit.propertyType,
    formatSqft(unit.sqftMin, unit.sqftMax),
  ].filter(Boolean);
  return `${parts.join(" · ")} — ${formatPrice(unit.launchPriceAed, "AED", { compact: true })}`;
}

/**
 * Wraps {@link PaymentCalculator} and seeds its purchase price from a specific
 * catalog unit rather than the project-wide minimum. When a project has more
 * than one unit type, a selector lets the visitor pick which unit's launch
 * price drives the calculation. The payment plan itself is still read from the
 * project (units in the catalog share it today).
 */
export function ProjectPaymentCalculator({
  project,
}: ProjectPaymentCalculatorProps) {
  const units = project.units;
  const [unitId, setUnitId] = useState(() => {
    if (!units.length) return "";
    const cheapest = units.reduce((min, u) =>
      u.launchPriceAed < min.launchPriceAed ? u : min,
    );
    return cheapest.id;
  });

  const selected = useMemo(
    () => units.find((u) => u.id === unitId) ?? units[0],
    [units, unitId],
  );

  const priceAed = selected?.launchPriceAed ?? project.minPriceAed ?? 0;

  return (
    <div className="space-y-4">
      {units.length > 1 ? (
        <label className="block max-w-md text-sm font-medium text-text-dark">
          Unit type
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setUnitId(e.target.value)}
            className="iop-input mt-1"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unitLabel(unit)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <PaymentCalculator
        key={selected?.id ?? "project"}
        priceAed={priceAed}
        paymentPlan={project.paymentPlan}
        projectName={project.name}
      />
    </div>
  );
}
