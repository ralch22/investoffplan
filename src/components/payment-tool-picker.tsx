"use client";

import { useMemo, useState } from "react";
import { ProjectPaymentCalculator } from "@/components/project-payment-calculator";
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
      <ProjectPaymentCalculator key={selected.slug} project={selected} />
    </div>
  );
}
