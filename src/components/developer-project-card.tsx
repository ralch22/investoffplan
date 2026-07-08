import Image from "next/image";
import Link from "next/link";
import { ContactButton } from "@/components/contact-button";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { projectBedsLabel, projectTypeLabel } from "@/lib/developer-utils";
import { cityLabel, formatLaunchPrice, formatPrice } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/cn";

interface DeveloperProjectCardProps {
  project: Project;
  priorityImage?: boolean;
}

export function DeveloperProjectCard({
  project,
  priorityImage = false,
}: DeveloperProjectCardProps) {
  const minPrice = Math.min(...project.units.map((unit) => unit.launchPriceAed));
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
    ? "Sold out"
    : project.status === "ready"
      ? "Ready"
      : "Off-plan";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md">
      <Link
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
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <DeveloperAttribution
          name={project.developer}
          logoUrl={project.developerLogo}
          variant="muted"
        />
        <h3 className="text-lg font-semibold leading-snug text-text-dark">
          <Link href={`/projects/${project.slug}`} className="hover:text-brand">
            {project.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{location}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-dark/80">
          {bedsLabel ? <span>{bedsLabel}</span> : null}
          <span className="capitalize">{typeLabel}</span>
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-light">
              Launch price
            </p>
            <p className="text-lg font-bold text-brand">
              {formatLaunchPrice(minPrice, maxPrice > minPrice ? maxPrice : undefined, "AED")}
            </p>
          </div>
          {project.paymentPlan ? (
            <p className="text-sm font-medium text-muted">{project.paymentPlan}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${project.slug}`}
              className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              View Details
            </Link>
            {!isSoldOut ? (
              <ContactButton
                phone={project.whatsapp}
                projectName={project.name}
                compact
              />
            ) : (
              <span className="rounded-full bg-surface-alt px-4 py-2 text-sm font-semibold text-muted">
                from {formatPrice(minPrice, "AED")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}