import type { ArticleSection } from "@/content/articles/types";

/** Renders drafted article/guide sections (headings, paragraphs, bullets). */
export function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <section key={section.heading ?? index}>
          {section.heading ? (
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {section.heading}
            </h2>
          ) : null}
          <div className="mt-3 space-y-4">
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 ps-6 text-muted">
              {section.bullets.map((bullet, bIndex) => (
                <li key={bIndex} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
