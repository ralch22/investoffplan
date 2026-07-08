"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MediaGalleryLightbox,
  ExpandIcon,
} from "@/components/media-gallery-lightbox";
import { formatBeds } from "@/lib/format";
import type { FloorPlan, Project } from "@/lib/types";

interface ProjectFloorPlansProps {
  project: Project;
}

export function ProjectFloorPlans({ project }: ProjectFloorPlansProps) {
  const plans = project.floorPlans ?? [];
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [bedsFilter, setBedsFilter] = useState<number | "all">("all");

  if (plans.length === 0) return null;

  const bedOptions = [...new Set(plans.map((plan) => plan.beds))].sort(
    (a, b) => a - b,
  );
  const visible =
    bedsFilter === "all" ? plans : plans.filter((plan) => plan.beds === bedsFilter);
  const images = visible.map((plan) => plan.imageUrl);

  return (
    <section
      id="floor-plans"
      aria-labelledby="floor-plans-heading"
      className="mt-10 scroll-mt-24"
    >
      <h2
        id="floor-plans-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        Floor <em className="italic">plans</em>
      </h2>
      <p className="mt-2 text-sm text-muted">
        {plans.length} layout{plans.length === 1 ? "" : "s"} published for{" "}
        {project.name}.
      </p>

      {bedOptions.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <BedChip
            label="All"
            active={bedsFilter === "all"}
            onClick={() => setBedsFilter("all")}
          />
          {bedOptions.map((beds) => (
            <BedChip
              key={beds}
              label={formatBeds(beds)}
              active={bedsFilter === beds}
              onClick={() => setBedsFilter(beds)}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plan, index) => (
          <button
            key={plan.imageUrl}
            type="button"
            onClick={() => {
              setActive(index);
              setOpen(true);
            }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-white p-3 text-start shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-surface-alt">
              <Image
                src={plan.imageUrl}
                alt={`${formatBeds(plan.beds)} floor plan — ${project.name}`}
                fill
                className="object-contain transition group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute bottom-2 end-2 rounded-full bg-surface-darker/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                <ExpandIcon />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 px-1 pb-1">
              <p className="text-sm font-semibold text-text-dark">
                {formatBeds(plan.beds)}
                {plan.layoutType ? ` · ${plan.layoutType}` : ""}
              </p>
              {plan.area ? (
                <p className="text-xs text-muted">{describePlanArea(plan)}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <MediaGalleryLightbox
        images={images}
        alt={`Floor plans — ${project.name}`}
        active={active}
        open={open}
        onClose={() => setOpen(false)}
        onPrev={() => setActive((prev) => (prev - 1 + images.length) % images.length)}
        onNext={() => setActive((prev) => (prev + 1) % images.length)}
        onSelect={setActive}
      />
    </section>
  );
}

function describePlanArea(plan: FloorPlan): string {
  // PF layout areas arrive in the same mixed scale as unit sizes; anything
  // below 300 reads as sqm for typical layouts.
  if (!plan.area) return "";
  return plan.area < 300
    ? `${Math.round(plan.area * 10.7639).toLocaleString()} sqft`
    : `${plan.area.toLocaleString()} sqft`;
}

function BedChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "iop-btn-press rounded-full border border-brand bg-brand px-4 py-1.5 text-sm font-semibold text-white"
          : "iop-btn-press rounded-full border border-border bg-white px-4 py-1.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
      }
    >
      {label}
    </button>
  );
}
