import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";
import type { SuitabilityScore, SuitabilityAudience } from "@/lib/suitability";

interface ProjectSuitabilityProps {
  scores: SuitabilityScore[];
  locale?: Locale;
}

const AUDIENCE_ORDER: SuitabilityAudience[] = ["family", "investor", "lifestyle"];

function AudienceGlyph({ audience }: { audience: SuitabilityAudience }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };
  if (audience === "family") {
    return (
      <svg {...common}>
        <circle cx="8" cy="7" r="2.5" />
        <circle cx="16" cy="7" r="2.5" />
        <path d="M4 20v-2a4 4 0 0 1 4-4M20 20v-2a4 4 0 0 0-4-4M11 20v-1a5 5 0 0 1 2-4" />
      </svg>
    );
  }
  if (audience === "investor") {
    return (
      <svg {...common}>
        <path d="M4 19h16M6 16l3-4 3 2 5-7" />
        <path d="M17 5h3v3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 20l3-8 6 3 3-9 6 5" />
      <path d="M3 20h18" />
    </svg>
  );
}

/**
 * "Who is this for" — rule-based suitability cards. Renders nothing when the
 * engine emitted no scores (data-thin project), so it never asserts a fit it
 * can't ground. All reason copy comes from dictionary keys + traceable values.
 */
export function ProjectSuitability({ scores, locale = "en" }: ProjectSuitabilityProps) {
  if (scores.length === 0) return null;
  const dict = getDictionary(locale);
  const t = dict.pdp.suitability;
  const ordered = [...scores].sort(
    (a, b) => AUDIENCE_ORDER.indexOf(a.audience) - AUDIENCE_ORDER.indexOf(b.audience),
  );

  return (
    <section
      id="suitability"
      aria-labelledby="suitability-heading"
      className="mt-10 scroll-mt-24"
    >
      <h2
        id="suitability-heading"
        className="font-display text-2xl font-semibold text-text-dark md:text-3xl"
      >
        {t.headingLead} <em className="italic">{t.headingEm}</em>
      </h2>
      <p className="prose-balance mt-2 max-w-2xl text-sm text-muted">{t.caption}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((s) => {
          const a = t.audiences[s.audience];
          return (
            <div
              key={s.audience}
              className="rounded-2xl border border-border bg-white p-5 shadow-elevation-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-brand">
                  <AudienceGlyph audience={s.audience} />
                  <h3 className="text-base font-semibold text-text-dark">{a}</h3>
                </div>
                <span
                  className={
                    s.tier === "strong"
                      ? "rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white"
                      : "rounded-full bg-surface-alt px-2.5 py-1 text-xs font-bold text-brand"
                  }
                >
                  {s.tier === "strong" ? t.tiers.strong : t.tiers.good}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {s.reasons.map((r, i) => {
                  const copy = t.reasons[r.key as keyof typeof t.reasons];
                  if (!copy) return null;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-dark/85">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                      <span>{r.value ? interpolate(copy, { value: r.value }) : copy}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-light">{t.disclaimer}</p>
    </section>
  );
}
