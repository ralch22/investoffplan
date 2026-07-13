import { developerDescription, developerFaqs } from "@/lib/developer-utils";
import { sanitizeProjectHtml } from "@/lib/sanitize-html";
import { cityLabel } from "@/lib/format";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

interface DeveloperAboutSectionProps {
  slug: string;
  name: string;
  description?: string;
  projectCount: number;
  cities: string[];
  foundedYear?: number;
  /** Set to "ar" by the /ar developer mirror so about chrome + FAQs localize. */
  locale?: Locale;
}

export function DeveloperAboutSection({
  slug,
  name,
  description,
  projectCount,
  cities,
  foundedYear,
  locale = "en",
}: DeveloperAboutSectionProps) {
  const dict = getDictionary(locale);
  const sanitizedHtml = description ? sanitizeProjectHtml(description) : "";
  const hasRichHtml = sanitizedHtml.length > 80;
  const plainText = developerDescription(slug, description);
  const cityLabels = cities.map((city) => cityLabel(city));
  const faqs = developerFaqs(name, projectCount, cityLabels, foundedYear, dict);

  if (!hasRichHtml && !plainText) return null;

  return (
    <section className="border-t border-border bg-surface-alt py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
          {interpolate(dict.developers.knowMoreAbout, { name })}
        </h2>

        {hasRichHtml ? (
          <div
            className="prose-balance mt-6 max-w-none space-y-4 text-base leading-relaxed text-text-dark/85 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ms-4 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <p className="prose-balance mt-6 max-w-3xl text-lg leading-relaxed text-text-dark/80">
            {plainText}
          </p>
        )}

        {cityLabels.length > 0 ? (
          <p className="mt-6 text-sm text-muted">
            {interpolate(dict.developers.activeCommunities, {
              list: cityLabels.join(" · "),
            })}
          </p>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqPageJsonLd(faqs)),
          }}
        />
        <div className="mt-10">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
