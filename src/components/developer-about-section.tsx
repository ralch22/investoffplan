import { developerDescription, developerFaqs } from "@/lib/developer-utils";
import { sanitizeProjectHtml } from "@/lib/sanitize-html";
import { cityLabel } from "@/lib/format";

interface DeveloperAboutSectionProps {
  slug: string;
  name: string;
  description?: string;
  projectCount: number;
  cities: string[];
  foundedYear?: number;
}

export function DeveloperAboutSection({
  slug,
  name,
  description,
  projectCount,
  cities,
  foundedYear,
}: DeveloperAboutSectionProps) {
  const sanitizedHtml = description ? sanitizeProjectHtml(description) : "";
  const hasRichHtml = sanitizedHtml.length > 80;
  const plainText = developerDescription(slug, description);
  const cityLabels = cities.map((city) => cityLabel(city));
  const faqs = developerFaqs(name, projectCount, cities, foundedYear);

  if (!hasRichHtml && !plainText) return null;

  return (
    <section className="border-t border-border bg-surface-alt py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
          Know more about {name}
        </h2>

        {hasRichHtml ? (
          <div
            className="prose-balance mt-6 max-w-none space-y-4 text-base leading-relaxed text-text-dark/85 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <p className="prose-balance mt-6 max-w-3xl text-lg leading-relaxed text-text-dark/80">
            {plainText}
          </p>
        )}

        {cityLabels.length > 0 ? (
          <p className="mt-6 text-sm text-muted">
            Active communities: {cityLabels.join(" · ")}
          </p>
        ) : null}

        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="faq-details rounded-2xl border border-border bg-white p-5 transition"
            >
              <summary className="cursor-pointer font-semibold text-text-dark">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}