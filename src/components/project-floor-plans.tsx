"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MediaGalleryLightbox,
  ExpandIcon,
} from "@/components/media-gallery-lightbox";
import {
  FloorPlanGateModal,
  useFloorPlanUnlock,
} from "@/components/floor-plan-gate";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { bedsLabel } from "@/lib/format";
import type { FloorPlan, Project } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";
import { unoptimizedProp } from "@/lib/asset-image";

interface ProjectFloorPlansProps {
  project: Project;
  locale?: Locale;
}

export function ProjectFloorPlans({ project, locale = "en" }: ProjectFloorPlansProps) {
  const dict = getDictionary(locale);
  const fp = dict.pdp.floorPlansSection;
  const plans = project.floorPlans ?? [];
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [bedsFilter, setBedsFilter] = useState<number | "all">("all");
  const [gateOpen, setGateOpen] = useState(false);
  const { unlocked, markUnlocked } = useFloorPlanUnlock();

  if (plans.length === 0) return null;

  // The first plan is always public (trust + indexable content); the rest sit
  // behind the one-time lead gate. Locked plans are NOT rendered pre-unlock —
  // users and crawlers see the same thing, so there is no cloaking ambiguity.
  const gated = plans.length > 1 && !unlocked;

  const bedOptions = [...new Set(plans.map((plan) => plan.beds))].sort(
    (a, b) => a - b,
  );
  const filtered =
    bedsFilter === "all" ? plans : plans.filter((plan) => plan.beds === bedsFilter);
  const visible = gated ? plans.slice(0, 1) : filtered;
  const images = visible.map((plan) => plan.imageUrl);

  const openGate = () => {
    trackEvent(ANALYTICS_EVENTS.FLOORPLANS_GATE_OPEN, {
      project_name: project.name,
    });
    setGateOpen(true);
  };

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
        {fp.heading}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {plans.length === 1
          ? interpolate(fp.countSingular, { name: project.name })
          : interpolate(fp.countPlural, { count: plans.length, name: project.name })}
      </p>

      {!gated && bedOptions.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <BedChip
            label={fp.all}
            active={bedsFilter === "all"}
            onClick={() => setBedsFilter("all")}
          />
          {bedOptions.map((beds) => (
            <BedChip
              key={beds}
              label={bedsLabel(beds, dict)}
              active={bedsFilter === beds}
              onClick={() => setBedsFilter(beds)}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plan, index) => (
          <button
            key={plan.imageUrl}
            type="button"
            onClick={() => {
              setActive(index);
              setOpen(true);
            }}
            className="focus-ring group relative overflow-hidden rounded-2xl border border-border bg-white p-3 text-start shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-surface-alt">
              <Image
                src={plan.imageUrl}
                alt={`${bedsLabel(plan.beds, dict)} floor plan — ${project.name}`}
                fill
                className="object-contain transition group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                {...unoptimizedProp(plan.imageUrl)}
              />
              <span className="absolute bottom-2 end-2 rounded-full bg-surface-darker/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                <ExpandIcon />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 px-1 pb-1">
              <p className="text-sm font-semibold text-text-dark">
                {bedsLabel(plan.beds, dict)}
                {plan.layoutType ? ` · ${plan.layoutType}` : ""}
              </p>
              {plan.area ? (
                <p className="text-xs text-muted">{describePlanArea(plan, fp.sqft)}</p>
              ) : null}
            </div>
          </button>
        ))}

        {gated ? (
          <button
            type="button"
            onClick={openGate}
            aria-label={fp.unlockCta}
            className="focus-ring group relative min-h-64 overflow-hidden rounded-2xl border border-border text-start shadow-sm transition hover:shadow-md sm:col-span-1 lg:col-span-2"
          >
            {/* Teaser backdrop: the already-public first plan, heavily blurred —
                implies the set without exposing any gated asset. */}
            <Image
              src={plans[0].imageUrl}
              alt=""
              aria-hidden
              fill
              className="scale-110 object-cover blur-md"
              sizes="(max-width: 640px) 100vw, 66vw"
              {...unoptimizedProp(plans[0].imageUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand/75 via-brand/45 to-surface-darker/75" />

            {/* Liquid-glass panel: blur + saturation, 1px inner light border,
                inset top highlight — physical-edge refraction, not a flat tint. */}
            <div className="relative z-10 m-5 flex min-h-52 flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/15 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-150">
              <LockGlyph />
              <p className="text-base font-semibold text-white">
                {interpolate(fp.lockedCount, { count: plans.length - 1 })}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-white/85">
                {fp.lockedHint}
              </p>
              <span className="iop-btn-press mt-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand shadow-sm transition group-hover:shadow-md">
                {fp.unlockCta}
              </span>
            </div>

            {/* Specular sweep on hover — the "liquid" in the glass. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 z-20 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[500%]"
            />
          </button>
        ) : null}
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

      <FloorPlanGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlocked={markUnlocked}
        projectName={project.name}
        projectSlug={project.slug}
        planCount={plans.length}
      />
    </section>
  );
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <circle cx="12" cy="15.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function describePlanArea(plan: FloorPlan, sqftTemplate: string): string {
  // PF layout areas arrive in the same mixed scale as unit sizes; anything
  // below 300 reads as sqm for typical layouts.
  if (!plan.area) return "";
  const value =
    plan.area < 300
      ? Math.round(plan.area * 10.7639).toLocaleString()
      : plan.area.toLocaleString();
  return interpolate(sqftTemplate, { value });
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
          ? "iop-btn-press focus-ring min-h-11 rounded-full border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white"
          : "iop-btn-press focus-ring min-h-11 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
      }
    >
      {label}
    </button>
  );
}
