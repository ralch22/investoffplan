import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GUIDE_CARDS } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Guides & insights",
  alternates: { canonical: `${getSiteUrl()}/guides` },
  description:
    "Expert guides on UAE off-plan investing, payment plans, Golden Visa, and market intelligence.",
};

export default async function InsightsPage() {
  const analytics = await getCatalogAnalytics();
  const brochureGap = analytics.projectCount - analytics.brochureCount;
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Investment Guides"
        subtitle="Understand the Off-Plan Property Market."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides" },
          ]}
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_CARDS.map((guide) => (
            <Link
              key={guide.title}
              href={guide.href}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
                ✓
              </span>
              <h2 className="mt-4 text-lg font-semibold text-text-dark">{guide.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guide.description}</p>
            </Link>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-border bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                Data coverage
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark">
                {analytics.brochureCount.toLocaleString()} brochure-backed projects
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {analytics.brochurePct}% of our {analytics.projectCount.toLocaleString()} tracked
                projects include an official PDF. Browse listings with verified brochures, or request
                the rest via WhatsApp.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/projects?collection=brochure"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Browse with brochures
              </Link>
              {brochureGap > 0 ? (
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
                >
                  {brochureGap} projects — request PDF
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl bg-brand p-8 text-white md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-4xl font-semibold">10 Years</p>
              <p className="mt-2 text-xl font-semibold">Golden Visa</p>
              <p className="mt-4 text-sm text-white/85">
                Qualifying off-plan investments can unlock long-term UAE residency
                benefits for international buyers.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm text-white/90">
                Use our payment calculator and compare tools to model entry price,
                handover timeline, and brochure-backed project research.
              </p>
              <Link
                href="/tools/payment"
                className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white/90"
              >
                Open calculator
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}