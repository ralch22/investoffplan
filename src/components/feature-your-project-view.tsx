import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { FeatureProjectForm } from "@/components/feature-project-form";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

function IncludedGlyph({ kind }: { kind: "home" | "search" | "leads" }) {
  const common = {
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };
  if (kind === "home") {
    return (
      <svg {...common}>
        <path d="M4 11l8-6 8 6M6 10v9h12v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    );
  }
  if (kind === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 12h4l2 5 4-12 2 7h6" />
    </svg>
  );
}

export function FeatureYourProjectView({
  locale = "en",
  heroImage,
}: {
  locale?: Locale;
  heroImage?: string;
}) {
  const t = getDictionary(locale).featureProject;
  const included: Array<{ kind: "home" | "search" | "leads"; title: string; body: string }> = [
    { kind: "home", title: t.included.home.title, body: t.included.home.body },
    { kind: "search", title: t.included.search.title, body: t.included.search.body },
    { kind: "leads", title: t.included.leads.title, body: t.included.leads.body },
  ];

  return (
    <PageShell headerVariant="transparent">
      <PageHero title={t.hero.title} subtitle={t.hero.subtitle} imageUrl={heroImage} />

      <section className="relative z-10 mx-auto -mt-10 max-w-[1100px] px-5 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {included.map((c) => (
            <div
              key={c.kind}
              className="rounded-2xl border border-border bg-white p-6 shadow-elevation-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <IncludedGlyph kind={c.kind} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-text-dark">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[1100px] px-5 md:px-8">
        <div className="rounded-2xl bg-surface-alt p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-text-dark md:text-2xl">
            {t.reach.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.reach.body}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.reach.stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-white p-4 text-center">
                <div className="font-display text-2xl font-bold text-brand">{s.value}</div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 mb-16 max-w-[720px] px-5 md:px-8">
        <div className="rounded-2xl border-t-4 border-brand bg-white p-6 shadow-xl md:p-8">
          <h2 className="text-2xl font-semibold text-text-dark">{t.formHeading}</h2>
          <p className="mt-2 text-sm text-muted">{t.formSubtitle}</p>
          <div className="mt-6">
            <FeatureProjectForm />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
