import type { ProjectEnrichment } from "@/lib/enrichment";

interface ProjectAboutProps {
  enrichment: ProjectEnrichment | null;
  brochureUrl?: string;
  videoUrl?: string;
  description?: string;
  amenities?: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProjectAbout({
  enrichment,
  brochureUrl,
  videoUrl,
  description,
  amenities: amenitiesProp,
}: ProjectAboutProps) {
  const clean = (u?: string) => (u && u !== "#" ? u : undefined);
  const brochure = clean(brochureUrl) || clean(enrichment?.brochureUrl);
  const video = clean(videoUrl) || clean(enrichment?.videoUrl);
  const catalogAmenities = amenitiesProp ?? [];
  const enrichmentAmenities = Array.isArray(enrichment?.facts.amenities)
    ? (enrichment.facts.amenities as string[])
    : [];
  const amenities = catalogAmenities.length ? catalogAmenities : enrichmentAmenities;
  const aboutText =
    enrichment?.summary ??
    (description ? stripHtml(description) : undefined);

  if (!aboutText && !brochure && !video && amenities.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 space-y-6">
      {aboutText ? (
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-dark">About</h2>
          <p className="mt-4 text-lg leading-relaxed text-text-dark/80">{aboutText}</p>
        </div>
      ) : null}

      {amenities.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-light">
            Amenities
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {amenities.map((a) => (
              <li
                key={a}
                className="rounded-full bg-surface-alt px-4 py-1.5 text-sm font-medium text-text-dark transition-colors duration-300 hover:bg-surface-dark hover:text-white"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(brochure || video) && (
        <div className="flex flex-wrap gap-3">
          {brochure ? (
            <a
              href={brochure}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-elevation-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-elevation-lg"
            >
              Download brochure →
            </a>
          ) : null}
          {video ? (
            <a
              href={video}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border-2 border-brand px-6 py-3 text-sm font-bold text-brand shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand hover:text-white"
            >
              Watch video
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}