import Script from "next/script";
import { LocaleLink } from "@/components/locale-link";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { getCatalogApi, getFeaturedProjects } from "@/lib/catalog";
import { getAllAreaStats, getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import { getOffplanVsReady } from "@/lib/dld-recent-sales";
import { aedToGbpLabel, aedToInrLabel, fxCaption } from "@/lib/fx";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { WHATSAPP_PRIMARY_DISPLAY } from "@/lib/contact-info";

/**
 * Shared international-investor landing page (/invest-from-india,
 * /invest-from-uk). One component, two audiences: the only differences are
 * the currency lens, copy voice, and FAQ set — the data is identical because
 * it all comes from the same grounded sources (live catalog + DLD aggregates
 * + the committed FX pin in data/fx-rates.json).
 *
 * Grounding rule (same as the community editorials): every number on this
 * page must trace to a repo data source. No visa, tax, or legal claims —
 * those change and we cannot ground them; the human team handles them.
 */

export interface GeoConfig {
  slug: "invest-from-india" | "invest-from-uk";
  audience: "India" | "UK";
  currency: "INR" | "GBP";
  h1: string;
  intro: string;
  faqs: Array<{ q: string; a: string }>;
}

const convert = (aed: number, currency: "INR" | "GBP") =>
  currency === "INR" ? aedToInrLabel(aed) : aedToGbpLabel(aed);

export async function GeoInvestPage({ config }: { config: GeoConfig }) {
  const api = await getCatalogApi();
  const featured = await getFeaturedProjects(3);
  const { source } = getDldSource();
  const base = getSiteUrl();

  // Entry price + band counts from the live catalog (min unit price per project).
  // Plausibility floor: the raw catalog carries a couple of sub-200K artifacts
  // (a 1,950 and a 163K row — per-sqft values or placeholders stored as
  // prices). Rendering "starts from AED 1,950" on a landing page would be the
  // exact credibility failure this page exists to avoid, so anything below a
  // realistic Dubai off-plan floor is excluded from the headline stats.
  const PLAUSIBLE_MIN_PRICE_AED = 200_000;
  const projectMinPrices = api.projects
    .map((p) => {
      const prices = (p.units ?? []).map((u) => u.launchPriceAed).filter((v) => v > 0);
      return prices.length ? Math.min(...prices) : null;
    })
    .filter((v): v is number => v != null && v >= PLAUSIBLE_MIN_PRICE_AED)
    .sort((a, b) => a - b);
  const entryPrice = projectMinPrices[0] ?? null;
  const bandCount = (lo: number, hi: number) =>
    projectMinPrices.filter((v) => v >= lo && v < hi).length;
  const bands = [
    { label: "Entry", lo: 0, hi: 1_000_000 },
    { label: "Mid-market", lo: 1_000_000, hi: 2_500_000 },
    { label: "Premium", lo: 2_500_000, hi: Number.MAX_SAFE_INTEGER },
  ].map((b) => ({
    ...b,
    count: bandCount(b.lo, b.hi),
    floorAed: b.lo === 0 ? (entryPrice ?? 0) : b.lo,
  }));

  // Payment-plan reality from the catalog, not marketing copy.
  const withPlan = api.projects.filter((p) => (p.paymentPlanCount ?? 0) > 0).length;

  // Top DLD-covered communities by transaction volume that also exist in the
  // catalog (so every link lands on a real page with inventory).
  const catalogAreas = new Set(
    api.projects.map((p) => (p.area || "").split(",")[0].trim().toUpperCase()),
  );
  const topCommunities = getAllAreaStats()
    .filter((s) => catalogAreas.has(s.areaLabel.toUpperCase()))
    .sort((a, b) => (b.saleSample ?? 0) - (a.saleSample ?? 0))
    .slice(0, 4);
  const bandCommunity = topCommunities[0] ?? null;
  const bandStats = bandCommunity ? getAreaStats(bandCommunity.areaLabel) : null;
  const bandSpread = bandCommunity ? getOffplanVsReady(bandCommunity.areaLabel) : null;

  const conversionRows = [750_000, 1_000_000, 2_000_000, 3_500_000];
  const url = `${base}/${config.slug}`;
  const faqJsonLd = buildFaqPageJsonLd(config.faqs);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: base },
    { name: config.h1, url },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <Script id={`faq-jsonld-${config.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <Script id={`breadcrumb-jsonld-${config.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbJsonLd)}
      </Script>

      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight text-text-dark sm:text-5xl" style={{ textWrap: "balance" }}>
          {config.h1}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{config.intro}</p>
        {entryPrice ? (
          <p className="mt-6 text-base text-text-dark">
            Off-plan projects in our live catalog start from{" "}
            <span className="font-semibold tabular-nums">
              AED {entryPrice.toLocaleString("en-US")}
            </span>{" "}
            — about <span className="font-semibold tabular-nums">{convert(entryPrice, config.currency)}</span>.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-light">{fxCaption(config.currency)}</p>
      </header>

      <section className="mt-14" aria-labelledby="budget-heading">
        <h2 id="budget-heading" className="font-serif text-2xl text-text-dark">
          What your budget buys in Dubai
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Live counts from our catalog of {api.projects.length.toLocaleString("en-US")} off-plan
          projects, grouped by each project&apos;s lowest launch price.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {bands.map((b) => (
            <div key={b.label} className="rounded-2xl border border-border bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{b.label}</p>
              <p className="mt-2 font-serif text-2xl text-text-dark tabular-nums">
                {convert(b.floorAed, config.currency)}+
              </p>
              <p className="text-sm text-muted tabular-nums">
                from AED {b.floorAed.toLocaleString("en-US")}
              </p>
              <p className="mt-3 text-sm text-text-dark tabular-nums">
                {b.count.toLocaleString("en-US")} projects
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full max-w-2xl text-sm">
            <caption className="mb-2 text-left text-sm font-semibold text-text-dark">
              Quick conversion guide
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th scope="col" className="py-2 pr-6 font-medium">Dubai price (AED)</th>
                <th scope="col" className="py-2 font-medium">
                  {config.currency === "INR" ? "Approx. in rupees" : "Approx. in pounds"}
                </th>
              </tr>
            </thead>
            <tbody>
              {conversionRows.map((aed) => (
                <tr key={aed} className="border-b border-border/60">
                  <td className="py-2 pr-6 tabular-nums">AED {aed.toLocaleString("en-US")}</td>
                  <td className="py-2 font-semibold tabular-nums">{convert(aed, config.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-light">{fxCaption(config.currency)}</p>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="communities-heading">
        <h2 id="communities-heading" className="font-serif text-2xl text-text-dark">
          Where {config.audience === "India" ? "Indian" : "UK"} buyers look first
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The busiest communities in {source} sales that also have live off-plan inventory in our
          catalog — real transaction volume, not promotion.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {topCommunities.map((c) => (
            <li key={c.areaLabel} className="flex min-w-0 items-baseline justify-between gap-3 rounded-xl border border-border bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-text-dark">{c.areaLabel}</p>
                <p className="text-sm text-muted tabular-nums">
                  AED {Math.round(c.medianPpsqft ?? 0).toLocaleString("en-US")}/sqft median ·{" "}
                  {(c.saleSample ?? 0).toLocaleString("en-US")} sales
                </p>
              </div>
              <LocaleLink
                href={`/sold-prices/${c.areaLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                className="shrink-0 text-sm font-semibold text-brand"
              >
                Sold prices →
              </LocaleLink>
            </li>
          ))}
        </ul>
        {bandStats && bandCommunity ? (
          <div className="mt-8">
            <DldAreaStatsBand
              stats={bandStats}
              areaName={bandCommunity.areaLabel}
              source={source}
              spread={bandSpread}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-16" aria-labelledby="projects-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="projects-heading" className="font-serif text-2xl text-text-dark">
            Featured off-plan projects
          </h2>
          <LocaleLink href="/projects" className="shrink-0 text-sm font-semibold text-brand">
            Browse all {api.projects.length.toLocaleString("en-US")} →
          </LocaleLink>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <ShowcaseProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      <section className="mt-16 max-w-3xl" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="font-serif text-2xl text-text-dark">
          Payment plans, as they actually are
        </h2>
        <p className="mt-3 leading-relaxed text-muted" style={{ textWrap: "pretty" }}>
          {withPlan.toLocaleString("en-US")} of the {api.projects.length.toLocaleString("en-US")}{" "}
          projects in our catalog publish a structured payment plan — typically a deposit followed
          by construction-linked instalments, with the balance at or after handover. Every project
          page lists its own schedule; prices are always contracted in AED.
        </p>
        <p className="mt-3 text-sm text-muted">
          See our{" "}
          <LocaleLink href="/faq/payment-plans" className="font-semibold text-brand">
            payment-plan guide
          </LocaleLink>{" "}
          for how the structures work.
        </p>
      </section>

      <section className="mt-16 max-w-3xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-serif text-2xl text-text-dark">
          Common questions from {config.audience === "India" ? "India" : "the UK"}
        </h2>
        <dl className="mt-6 space-y-6">
          {config.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-text-dark">{f.q}</dt>
              <dd className="mt-1 leading-relaxed text-muted" style={{ textWrap: "pretty" }}>
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 rounded-2xl border border-border bg-white px-6 py-8">
        <h2 className="font-serif text-2xl text-text-dark">Talk to a human</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Shortlists, floor plans, and current availability — our team works across time zones on
          WhatsApp at <span className="font-semibold tabular-nums">{WHATSAPP_PRIMARY_DISPLAY}</span>.
        </p>
      </section>
    </main>
  );
}
