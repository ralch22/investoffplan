import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { enMeta } from "@/lib/ar-meta";
import { interpolate, localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = {
  title: "Dubai Off-Plan Buying Guides & Investor Insights",
  alternates: enMeta("/guides"),
  description:
    "Expert guides on UAE off-plan investing, payment plans, Golden Visa, and market intelligence.",
};

// Also rendered by the /ar mirror with locale="ar" so guide/CTA links stay in-locale.
export default async function InsightsPage({
  locale = "en",
}: {
  locale?: Locale;
} = {}) {
  const analytics = await getCatalogAnalytics();
  const brochureGap = analytics.projectCount - analytics.brochureCount;
  const heroImage = await getHeroImage();
  const dict = getDictionary(locale);
  const t = dict.pages.guides;
  const fmtLocale = locale === "ar" ? "ar-AE" : "en-US";
  const numberFmt = (n: number) => n.toLocaleString(fmtLocale);
  const cardCopy = t.cards as Record<string, { title: string; description: string }>;

  return (
    <PageShell headerVariant="transparent">
      <PageHero title={t.heroTitle} subtitle={t.heroSubtitle} imageUrl={heroImage} />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.guides },
          ]}
        />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_CARDS.map((guide) => {
            const copy = cardCopy[guide.slug] ?? {
              title: guide.title,
              description: guide.description,
            };
            return (
              <Link
                key={guide.slug}
                href={localePath(locale, guide.href)}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
                  ✓
                </span>
                <h2 className="mt-4 text-lg font-semibold text-text-dark">{copy.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy.description}</p>
              </Link>
            );
          })}
        </div>

        <section className="mt-14 rounded-2xl border border-border bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                {t.dataCoverageEyebrow}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark">
                {interpolate(t.brochureBackedHeading, {
                  count: numberFmt(analytics.brochureCount),
                })}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {interpolate(t.brochureBackedBody, {
                  pct: numberFmt(analytics.brochurePct),
                  projects: numberFmt(analytics.projectCount),
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={localePath(locale, "/projects?collection=brochure")}
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                {t.browseBrochures}
              </Link>
              {brochureGap > 0 ? (
                <Link
                  href={localePath(locale, "/projects")}
                  className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
                >
                  {interpolate(t.requestPdf, { count: numberFmt(brochureGap) })}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl bg-brand p-8 text-white md:p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-4xl font-semibold">{t.yearsLabel}</p>
              <p className="mt-2 text-xl font-semibold">{t.goldenVisaTitle}</p>
              <p className="mt-4 text-sm text-white/85">{t.goldenVisaBody}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm text-white/90">{t.toolsHint}</p>
              <Link
                href={localePath(locale, "/tools/payment")}
                className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white/90"
              >
                {t.openCalculator}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
