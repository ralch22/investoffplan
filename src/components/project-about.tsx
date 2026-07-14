import type { ProjectEnrichment } from "@/lib/enrichment";
import { htmlToPlainText, sanitizeProjectHtml } from "@/lib/sanitize-html";
import { ExpandableRichText } from "@/components/expandable-rich-text";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ScrollReveal } from "@/components/scroll-reveal";

// Descriptions past this render clamped behind a "Read more" toggle.
const DESCRIPTION_TRUNCATE_CHARS = 4000;

interface ProjectAboutProps {
  enrichment: ProjectEnrichment | null;
  brochureUrl?: string;
  videoUrl?: string;
  description?: string;
  amenities?: string[];
  locale?: Locale;
  /**
   * Factual, verified-claims-only fallback prose for thin PDPs that carry no
   * real description / enrichment summary. Rendered as the About body (with the
   * normal heading) only when no richer text exists — see project detail page.
   */
  factualFallback?: string;
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
  locale = "en",
  factualFallback,
}: ProjectAboutProps) {
  const about = getDictionary(locale).pdp.about;
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
  // Empty-string strip of junk HTML (`<p><br></p>`) must not block the factual
  // fallback — `??` only reacts to null/undefined, not "".
  const proseText =
    aboutText && aboutText.trim().length > 0 ? aboutText : factualFallback;

  if (!proseText && !hasRichHtml && !brochure && !video && amenities.length === 0) {
    return null;
  }

  return (
    <ScrollReveal as="section" aria-labelledby="about-heading" className="mt-10 space-y-6">
      {hasRichHtml ? (
        <div>
          <h2
            id="about-heading"
            className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
          >
            {about.headingLead} <em className="italic">{about.headingEm}</em>
          </h2>
          <ExpandableRichText
            html={sanitizedHtml}
            truncate={sanitizedHtml.length > DESCRIPTION_TRUNCATE_CHARS}
            className="prose-balance mt-4 max-w-none space-y-4 text-base leading-relaxed text-text-dark/90 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-dark [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text-dark [&_li]:ms-5 [&_li]:list-disc [&_li]:pl-1 [&_li]:marker:text-brand [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:space-y-2"
          />
        </div>
      ) : proseText ? (
        <div>
          <h2
            id="about-heading"
            className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
          >
            {about.headingLead} <em className="italic">{about.headingEm}</em>
          </h2>
          <p className="prose-balance mt-4 text-lg leading-relaxed text-text-dark/80">
            {proseText}
          </p>
        </div>
      ) : null}

      {amenities.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-light">
            {about.amenities}
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {amenities.map((a) => (
              <li
                key={a}
                className="rounded-full bg-surface-alt px-4 py-1.5 text-sm font-medium text-text-dark transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-dark hover:text-white hover:shadow-elevation-sm cursor-default"
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
              {about.downloadBrochure}
            </a>
          ) : null}
          {video ? (
            <a
              href="#media"
              className="inline-flex items-center rounded-full border-2 border-brand px-6 py-3 text-sm font-bold text-brand shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand hover:text-white"
            >
              {about.watchVideo}
            </a>
          ) : null}
        </div>
      )}
    </ScrollReveal>
  );
}