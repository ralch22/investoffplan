import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { LOCATION_GUIDES, guideText } from "@/lib/location-guides";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Location Guides — Communities Ranked on Real Data",
  description:
    "Where to buy off-plan in Dubai: communities ranked on real Dubai Land Department data — best for families, highest rental yields, most affordable, best value per sqft, and most liquid for resale.",
  alternates: enMeta("/locations"),
};

export function LocationsPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.pages.locations;

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        italicTitle
        subtitle={t.heroSubtitle}
      />
      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {LOCATION_GUIDES.map((guide) => (
            <LocaleLink
              key={guide.slug}
              href={`/locations/${guide.slug}`}
              className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-6 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
            >
              <p className="section-eyebrow">{guideText(guide, "metricLabel", locale)}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-text-dark group-hover:text-brand">
                {guideText(guide, "h1", locale)}
                <span className="text-brand">.</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guideText(guide, "intro", locale)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                {t.seeRanking}
                <span
                  className="transition group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </span>
            </LocaleLink>
          ))}
        </div>
      </main>
    </PageShell>
  );
}

export default function LocationGuidesPage() {
  return <LocationsPageContent />;
}
