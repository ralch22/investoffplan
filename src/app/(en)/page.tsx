import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { HeroSearch } from "@/components/hero-search";
import { PrimaryButton } from "@/components/ui/primary-button";
import { HomeFeaturedGrid } from "@/components/home-featured-grid";
import { DeveloperLogo } from "@/components/developer-logo";
import {
  getFeaturedProjects,
  getSiteStats,
  getAreas,
  getDevelopers,
} from "@/lib/catalog";
import { unoptimizedProp } from "@/lib/asset-image";
import { AdvantageMatrix } from "@/components/advantage-matrix";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "UAE Off-Plan Properties",
  description:
    "Browse 2,000+ off-plan units with brochures, compare tools, payment plans, and live map intelligence across Dubai and the UAE.",
  alternates: {
    canonical: getSiteUrl(),
    languages: { en: getSiteUrl() || "/", ar: `${getSiteUrl()}/ar` },
  },
};

const PROPERTY_TYPES = [
  { href: "/projects?type=apartment", label: "Apartments" },
  { href: "/projects?type=townhouse", label: "Townhouses" },
  { href: "/projects?type=villa", label: "Villas" },
  { href: "/projects?type=penthouse", label: "Penthouses" },
];

const HIGHLIGHTS = [
  { value: "10%", label: "Average ROI potential on prime launches" },
  { value: "10 Years", label: "Golden Visa eligibility on qualifying investments" },
  { value: "80/20", label: "Flexible payment plans across the catalog" },
];

const FAQS = [
  {
    q: "What is an off-plan property?",
    a: "An off-plan property is purchased before construction is complete, often with staged payment plans tied to construction milestones.",
  },
  {
    q: "How do payment plans work?",
    a: "Most UAE off-plan projects offer plans such as 20/80, 40/60, or 60/40 — a deposit on booking with the balance during construction and on handover.",
  },
  {
    q: "Can I compare multiple units?",
    a: "Yes. Select up to three units on any search results page and open the compare view for side-by-side pricing, handover, and brochure status.",
  },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "invest off-plan",
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/brand/icon-red.png`,
  description:
    "UAE off-plan property intelligence platform with unit-level pricing, brochures, and compare tools.",
};

export default async function HomePage() {
  const stats = await getSiteStats();
  const analytics = await getCatalogAnalytics();
  const featured = await getFeaturedProjects(6);
  const latest = await getFeaturedProjects(4);
  const topAreas = (await getAreas()).slice(0, 6);
  const topDevelopers = (await getDevelopers()).slice(0, 8);
  const heroImage = featured[0]?.imageUrl;

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <section className="relative flex min-h-[min(100dvh,880px)] flex-col justify-end overflow-hidden bg-surface-dark text-white">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            {...unoptimizedProp(heroImage)}
          />
        ) : null}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
          <p className="reveal text-sm font-medium text-white/80">
            UAE off-plan intelligence for serious buyers
          </p>
          <h1 className="font-display reveal mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            UAE&apos;s{" "}
            <em className="not-italic italic text-white/90">Premier</em>{" "}
            Off&#8209;Plan Platform
          </h1>
          <p className="prose-balance reveal mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            {stats.unitCount.toLocaleString()} unit options across{" "}
            {stats.projectCount.toLocaleString()} projects — brochures, price per
            sqft, compare, and a live map in one place.
          </p>
          <div className="reveal mt-8">
            <HeroSearch />
          </div>
          <div className="reveal mt-4 flex flex-wrap gap-3">
            <PrimaryButton href="/projects">Browse all properties</PrimaryButton>
            <PrimaryButton href="/map" variant="ghost" showArrow={false}>
              Open map
            </PrimaryButton>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border bg-white py-5 marquee-mask">
        <div className="relative flex items-center gap-14">
          <div className="flex animate-[marquee_40s_linear_infinite] items-center gap-14 whitespace-nowrap hover:[animation-play-state:paused]">
            {[...topDevelopers, ...topDevelopers].map((dev, i) => (
              <Link
                key={`${dev.slug}-${i}`}
                href={`/developers/${dev.slug}`}
                className="flex shrink-0 items-center gap-3 opacity-70 transition hover:opacity-100"
              >
                <DeveloperLogo
                  name={dev.name}
                  logoUrl={dev.logoUrl}
                  slug={dev.slug}
                  size="sm"
                  className="border border-border"
                />
                <span className="text-lg font-bold tracking-tight text-surface-dark">
                  {dev.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <p className="section-eyebrow text-center">Live catalog intelligence</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Unit options", value: stats.unitCount.toLocaleString(), hint: "Across all emirates" },
            { label: "Brochure PDFs", value: analytics.brochureCount.toLocaleString(), hint: "Download or WhatsApp" },
            { label: "Map-ready projects", value: analytics.withCoords.toLocaleString(), hint: "With coordinates" },
            { label: "Avg AED/sqft", value: analytics.avgPpsf.toLocaleString(), hint: "Catalog benchmark" },
          ].map((item) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevation-md"
            >
              <p className="font-display text-3xl font-semibold tabular-nums text-brand md:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-dark">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-light">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <HomeFeaturedGrid latest={latest} featured={featured} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
              Key <em className="italic">Locations.</em>
            </h2>
            <Link
              href="/areas"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View All Locations →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topAreas.map((area, index) => (
              <Link
                key={area.slug}
                href={`/areas/${area.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
              >
                <div className="area-card-accent relative px-6 py-5">
                  <span className="font-display text-5xl font-semibold leading-none text-brand/15">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-xl font-semibold text-text-dark transition group-hover:text-brand">
                    {area.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {area.cityLabel} · {area.projectCount} projects
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border px-6 py-4">
                  <span className="text-sm font-semibold text-brand">Explore area</span>
                  <span className="text-brand transition group-hover:translate-x-0.5" aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
              Property <em className="italic">Types.</em>
            </h2>
            <Link
              href="/projects"
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              View All →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROPERTY_TYPES.map((type) => (
              <Link
                key={type.label}
                href={type.href}
                className="group rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-elevation-md"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                  <PropertyTypeIcon label={type.label} />
                </span>
                <p className="mt-4 text-lg font-semibold text-text-dark group-hover:text-brand">
                  {type.label}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Browse off-plan {type.label.toLowerCase()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
                Find the Perfect<br />
                <em className="italic">Property Investment.</em>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Browse UAE&apos;s most comprehensive off-plan catalog with unit-level pricing,
                brochures, and live map intelligence.
              </p>
              <PrimaryButton href="/projects" className="mt-6">
                Browse Properties
              </PrimaryButton>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
                >
                  <p className="text-3xl font-semibold text-brand">{item.value}</p>
                  <p className="mt-2 text-xs text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AdvantageMatrix />

      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
            Frequently <em className="italic">Asked Questions.</em>
          </h2>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildFaqPageJsonLd(FAQS)),
            }}
          />
          <div className="mt-8">
            <FaqAccordion faqs={FAQS} />
          </div>
          <p className="mt-6 text-sm text-muted">
            More questions?{" "}
            <Link href="/faq" className="font-semibold text-brand hover:text-brand-dark">
              Browse the full FAQ →
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Book a Consultation<br />
            <em className="italic">with an Off&#8209;Plan Expert.</em>
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            Leave your contact details to register your interest in launches,
            brochures, and payment plans.
          </p>
          <PrimaryButton href="/contact" className="mt-6">
            Book a consultation
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}

function PropertyTypeIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    Apartments: "M4 18V8l8-5 8 5v10M8 18v-4h8v4",
    Townhouses: "M3 12l9-7 9 7v8H3zM9 20v-6h6v6",
    Villas: "M4 10l8-6 8 6v10H4zM10 20v-5h4v5",
    Penthouses: "M4 14h16M6 14V8h12v6M8 20h8",
  };
  const d = paths[label] ?? "M4 12h16M4 6h16M4 18h16";
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}