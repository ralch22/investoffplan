"use client";

import { useMemo, useState } from "react";
import { PaymentCalculator } from "@/components/payment-calculator";
import type { Project } from "@/lib/types";

interface PaymentToolPickerProps {
  projects: Project[];
}

export function PaymentToolPicker({ projects }: PaymentToolPickerProps) {
  const [slug, setSlug] = useState(projects[0]?.slug ?? "");

  const selected = useMemo(
    () => projects.find((p) => p.slug === slug) ?? projects[0],
    [projects, slug],
  );

  if (!selected) return null;

  const minPrice = Math.min(...selected.units.map((u) => u.launchPriceAed));

  return (
    <div className="space-y-6">
      <label className="block max-w-md text-sm font-medium text-text-dark">
        Sample project
        <select
          value={selected.slug}
          onChange={(e) => setSlug(e.target.value)}
          className="iop-input mt-1"
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} — {p.paymentPlan}
            </option>
          ))}
        </select>
      </label>
      <PaymentCalculator
        key={selected.slug}
        priceAed={minPrice}
        paymentPlan={selected.paymentPlan}
        projectName={selected.name}
      />
    </div>
  );
}