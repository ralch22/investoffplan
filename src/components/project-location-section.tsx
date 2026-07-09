import { LocaleLink } from "@/components/locale-link";
import { cityLabel } from "@/lib/format";
import { communitySlugFor } from "@/lib/community-slug";
import type { Project } from "@/lib/types";

interface ProjectLocationSectionProps {
  project: Project;
}

export function ProjectLocationSection({ project }: ProjectLocationSectionProps) {
  const areaSlug = communitySlugFor(project.area);
  const googleMapsUrl = project.coordinates
    ? `https://www.google.com/maps?q=${project.coordinates.lat},${project.coordinates.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(project.area + " Dubai UAE")}`;
  const osmEmbed = project.coordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${project.coordinates.lng - 0.02}%2C${project.coordinates.lat - 0.015}%2C${project.coordinates.lng + 0.02}%2C${project.coordinates.lat + 0.015}&layer=mapnik&marker=${project.coordinates.lat}%2C${project.coordinates.lng}`
    : null;

  return (
    <section id="location" aria-labelledby="location-heading" className="mt-10 scroll-mt-24">
      <h2
        id="location-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        <em className="italic">Location</em>
      </h2>
      <p className="mt-3 text-muted">
        {cityLabel(project.city)}, United Arab Emirates · {project.area}
      </p>

      {osmEmbed ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border shadow-elevation-sm">
          <iframe
            title={`Map showing ${project.name} in ${project.area}`}
            src={osmEmbed}
            className="h-72 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt text-sm text-muted">
          Map coordinates coming soon
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="iop-btn-press focus-ring rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
        >
          Open in Google Maps
        </a>
        {project.coordinates ? (
          <LocaleLink
            href={`/map?project=${project.slug}`}
            className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            View on project map
          </LocaleLink>
        ) : null}
        <LocaleLink
          href={`/communities/${areaSlug}`}
          className="iop-btn-press focus-ring rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
        >
          Explore {project.area.split(",")[0]}
        </LocaleLink>
      </div>
    </section>
  );
}