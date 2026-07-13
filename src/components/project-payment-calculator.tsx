"use client";

import { useMemo, useState } from "react";
import { PaymentCalculator } from "@/components/payment-calculator";
import { bedsLabel, formatPrice, propertyTypeLabel, sqftLabel } from "@/lib/format";
import { parsePaymentPlan } from "@/lib/investment-metrics";
import type { Project, UnitType } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { useI18n } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";

interface ProjectPaymentCalculatorProps {
  project: Project;
  /**
   * Explicit locale from the server page tree. Prefer this over useI18n alone so
   * AR PDP SSR never falls back to the EN default context (#327 residual).
   */
  locale?: Locale;
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
  locale: localeProp,
}: ProjectPaymentCalculatorProps) {
  const i18n = useI18n();
  // Prefer page-prop locale so AR SSR does not flash EN dict defaults.
  const locale: Locale = localeProp ?? i18n.locale;
  const dict = localeProp ? getDictionary(localeProp) : i18n.dict;
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
      sqftLabel(unit.sqftMin, unit.sqftMax, dict),
    ].filter(Boolean);
    return `${parts.join(" · ")} — ${formatPrice(unit.launchPriceAed, "AED", { compact: true })}`;
  }

  return (
    <div className="space-y-4">
      {units.length > 1 ? (
        <label className="block max-w-md text-sm font-medium text-text-dark">
          {dict.pdp.unitType}
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setUnitId(e.target.value)}
            className="iop-input mt-1"
            data-testid="pdp-unit-type-select"
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
