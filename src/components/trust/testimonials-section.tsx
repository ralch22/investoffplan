import { TESTIMONIALS } from "@/content/trust";

/**
 * Content-gated testimonials grid. Renders NOTHING until real, consented
 * quotes exist in src/content/trust.ts — fabricated testimonials cannot ship.
 */
export function TestimonialsSection() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
      <h2 className="font-display text-3xl font-semibold text-text-dark">
        Client Experiences<span className="text-brand">.</span>
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={`${t.name}-${t.quote.slice(0, 24)}`}
            className="flex flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-elevation-sm"
          >
            <blockquote className="text-sm leading-relaxed text-text-dark">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-semibold text-text-dark">{t.name}</p>
              {t.context ? (
                <p className="mt-0.5 text-xs text-muted">{t.context}</p>
              ) : null}
              {t.source === "google" ? (
                <p className="mt-1 text-xs text-muted">Google review</p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
