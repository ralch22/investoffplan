import type { ProjectEnrichment } from "@/lib/enrichment";
import { htmlToPlainText, sanitizeProjectHtml } from "@/lib/sanitize-html";
import { ExpandableRichText } from "@/components/expandable-rich-text";

// Descriptions past this render clamped behind a "Read more" toggle.
const DESCRIPTION_TRUNCATE_CHARS = 4000;

interface ProjectAboutProps {
  enrichment: ProjectEnrichment | null;
  brochureUrl?: string;
  videoUrl?: string;
  description?: string;
  amenities?: string[];
}

function stripHtml(html: string): string {
  return htmlToPlainText(html);
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
  const sanitizedHtml = description ? sanitizeProjectHtml(description) : "";
  const hasRichHtml = sanitizedHtml.length > 80;
  const aboutText =
    enrichment?.summary ??
    (description && !hasRichHtml ? stripHtml(description) : undefined);

  if (!aboutText && !hasRichHtml && !brochure && !video && amenities.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="about-heading" className="mt-10 space-y-6">
      {hasRichHtml ? (
        <div>
          <h2
            id="about-heading"
            className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
          >
            About the <em className="italic">project</em>
          </h2>
          <ExpandableRichText
            html={sanitizedHtml}
            truncate={sanitizedHtml.length > DESCRIPTION_TRUNCATE_CHARS}
            className="prose-balance mt-4 max-w-none space-y-4 text-base leading-relaxed text-text-dark/85 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ms-4 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1"
          />
        </div>
      ) : aboutText ? (
        <div>
          <h2
            id="about-heading"
            className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
          >
            About the <em className="italic">project</em>
          </h2>
          <p className="prose-balance mt-4 text-lg leading-relaxed text-text-dark/80">
            {aboutText}
          </p>
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
              href="#media"
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