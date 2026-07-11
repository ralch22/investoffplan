import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { LOCATION_GUIDES } from "@/lib/location-guides";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Dubai Location Guides — Communities Ranked on Real Data",
  description:
    "Where to buy off-plan in Dubai: communities ranked on real Dubai Land Department data — best for families, highest rental yields, most affordable, best value per sqft, and most liquid for resale.",
  alternates: { canonical: `${getSiteUrl()}/locations` },
};

export default function LocationGuidesPage() {
  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Location guides"
        italicTitle
        subtitle="Where to buy in Dubai, answered with data — communities ranked on real Dubai Land Department 2025 transactions and our live off-plan catalog."
      />
      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {LOCATION_GUIDES.map((guide) => (
            <LocaleLink
              key={guide.slug}
              href={`/locations/${guide.slug}`}
              className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-6 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
            >
              <p className="section-eyebrow">{guide.metricLabel}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-text-dark group-hover:text-brand">
                {guide.h1}
                <span className="text-brand">.</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guide.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                See the ranking
                <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
              </span>
            </LocaleLink>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
