"use client";

import { useMemo, useState } from "react";
import { PaymentCalculator } from "@/components/payment-calculator";
import { bedsLabel, formatPrice, formatSqft, propertyTypeLabel } from "@/lib/format";
import { parsePaymentPlan } from "@/lib/investment-metrics";
import type { Project, UnitType } from "@/lib/types";
import { useI18n } from "@/i18n/locale-provider";

interface ProjectPaymentCalculatorProps {
  project: Project;
}

/**
 * Wraps {@link PaymentCalculator} and seeds its purchase price from a specific
 * catalog unit rather than the project-wide minimum. When a project has more
 * than one unit type, a selector lets the visitor pick which unit's launch
 * price drives the calculation. The payment plan itself is still read from the
 * project (units in the catalog share it today).
 *
 * Returns null when the plan is not a real numeric schedule so PDP / tools
 * never render an empty calculator card (hooks always run first).
 */
export function ProjectPaymentCalculator({
  project,
}: ProjectPaymentCalculatorProps) {
  const { dict, locale } = useI18n();
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
  // Hide empty / non-numeric plans (blank, "2 Payment Plans", "AED 0", …).
  if (!parsePaymentPlan(project.paymentPlan ?? "")) return null;

  function unitLabel(unit: UnitType): string {
    const parts = [
      bedsLabel(unit.beds, dict),
      propertyTypeLabel(unit.propertyType, dict, locale),
      formatSqft(unit.sqftMin, unit.sqftMax),
    ].filter(Boolean);
    return `${parts.join(" · ")} — ${formatPrice(unit.launchPriceAed, "AED", { compact: true })}`;
  }

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
