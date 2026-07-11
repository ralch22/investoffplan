"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { ContactButton } from "@/components/contact-button";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { projectBedsLabel, projectTypeLabel } from "@/lib/developer-utils";
import { cityLabel, formatLaunchPrice, formatPrice } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/cn";
import { unoptimizedProp } from "@/lib/asset-image";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface DeveloperProjectCardProps {
  project: Project;
  priorityImage?: boolean;
}

export function DeveloperProjectCard({
  project,
  priorityImage = false,
}: DeveloperProjectCardProps) {
  const { dict } = useI18n();
  // Only consider PF-stated (positive) prices so a no-price unit can't make the
  // card read "from AED 0" — mirrors the >0 guard on the SERP card / PDP.
  const positivePrices = project.units
    .map((unit) => unit.launchPriceAed)
    .filter((price) => price > 0);
  const minPrice = positivePrices.length ? Math.min(...positivePrices) : 0;
  const maxPrice = Math.max(
    ...project.units.map((unit) => unit.launchPriceMaxAed ?? unit.launchPriceAed),
  );
  const isSoldOut = project.status === "sold-out";
  const bedsLabel = projectBedsLabel(project);
  const typeLabel = projectTypeLabel(project);
  const location =
    project.locationFull ??
    [cityLabel(project.city), project.area].filter(Boolean).join(", ");
  const statusBadge = isSoldOut
    ? dict.common.soldOut
    : project.status === "ready"
      ? dict.developers.ready
      : dict.developers.offPlan;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md">
      <LocaleLink
        href={`/projects/${project.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-surface-alt"
      >
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.name}
            fill
            priority={priorityImage}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition duration-500 group-hover:scale-[1.02]",
              isSoldOut && "grayscale",
            )}
            {...unoptimizedProp(project.imageUrl)}
          />
        ) : (
          <div className={cn("h-full bg-gradient-to-br", project.imageGradient)} />
        )}
        <span className="absolute start-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
          {statusBadge}
        </span>
        {project.handover ? (
          <span className="absolute end-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-text-dark shadow-sm">
            {project.handover}
          </span>
        ) : null}
      </LocaleLink>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <DeveloperAttribution
          name={project.developer}
          logoUrl={project.developerLogo}
          variant="muted"
        />
        <h3 className="text-lg font-semibold leading-snug text-text-dark">
          <LocaleLink href={`/projects/${project.slug}`} className="hover:text-brand">
            {project.name}
          </LocaleLink>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{location}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-dark/80">
          {bedsLabel ? <span>{bedsLabel}</span> : null}
          <span className="capitalize">{typeLabel}</span>
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-light">
              {dict.developers.launchPrice}
            </p>
            <p className="text-lg font-bold text-brand">
              {formatLaunchPrice(minPrice, maxPrice > minPrice ? maxPrice : undefined, "AED")}
            </p>
          </div>
          {project.paymentPlan ? (
            <p className="text-sm font-medium text-muted">{project.paymentPlan}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <LocaleLink
              href={`/projects/${project.slug}`}
              className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              {dict.common.viewDetails}
            </LocaleLink>
            {!isSoldOut ? (
              <ContactButton
                phone={project.whatsapp}
                projectName={project.name}
                compact
              />
            ) : (
              <span className="rounded-full bg-surface-alt px-4 py-2 text-sm font-semibold text-muted">
                {minPrice > 0
                  ? interpolate(dict.common.fromPrice, {
                      price: formatPrice(minPrice, "AED"),
                    })
                  : formatLaunchPrice(minPrice, undefined, "AED")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}