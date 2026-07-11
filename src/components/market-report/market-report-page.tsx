import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { TrendChart } from "@/components/trend-chart";
import { getMarketReportData } from "@/lib/market-report-data";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { formatPrice } from "@/lib/format";

/**
 * Public, INDEXABLE flagship "UAE Off-Plan Property Market Report".
 *
 * Distinct from /reports/market/[slug] (noindex, print-CSS, gated PDF): this is
 * a single evergreen editorial page built entirely from live DLD aggregates +
 * the catalog. Server-rendered, ISR (hourly, inherited from the (en)/(ar)
 * layout), no cookies/headers — safe to prerender. Both the EN page and the AR
 * mirror render this component with their locale so `marketReport.*` translates.
 */

type T = ReturnType<typeof getDictionary>["marketReport"];

const numberFmt = (n: number) => n.toLocaleString("en-US");
const typeLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const changeLabel = (pct: number) => `${pct > 0 ? "+" : ""}${pct}%`;

export async function MarketReportPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.marketReport;
  const data = await getMarketReportData();
  const lp = (href: string) => localePath(locale, href);

  const dateStr = new Date(data.catalogUpdated).toLocaleDateString(
    locale === "ar" ? "ar-AE" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  const canonical = `${getSiteUrl()}${lp("/market-report")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${t.title} ${data.year}`,
        description: t.subtitle,
        inLanguage: locale,
        datePublished: data.catalogUpdated,
        dateModified: data.catalogUpdated,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        author: { "@type": "Organization", name: "invest off-plan" },
        publisher: {
          "@type": "Organization",
          name: "invest off-plan",
          logo: { "@type": "ImageObject", url: `${getSiteUrl()}/brand/icon-red.png` },
        },
      },
      {
        "@type": "Dataset",
        name: `${t.title} ${data.year}`,
        description: t.subtitle,
        url: canonical,
        dateModified: data.catalogUpdated,
        temporalCoverage: data.dldPeriod,
        spatialCoverage: "United Arab Emirates",
        isAccessibleForFree: true,
        creator: { "@type": "Organization", name: "invest off-plan" },
        variableMeasured: [
          "Gross rental yield",
          "Median sold price per sqft",
          "Off-plan launch price",
          "Handover pipeline",
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${getSiteUrl()}${lp("/")}` },
          { "@type": "ListItem", position: 2, name: t.title, item: canonical },
        ],
      },
    ],
  };

  const maxYield = data.yields.reduce((m, y) => Math.max(m, y.grossYieldPct), 0) || 1;

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero title={`${t.title} ${data.year}`} italicTitle subtitle={t.subtitle}>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/80">
          <span>{interpolate(t.dataAsOf, { date: dateStr })}</span>
          <span aria-hidden>·</span>
          <span>{interpolate(t.dldPeriodLabel, { period: data.dldPeriod })}</span>
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1100px] px-5 py-12 md:px-8">
        {/* 1 — Market overview */}
        <Section title={t.overviewTitle}>
          <p className="max-w-3xl text-muted">
            {interpolate(t.overviewBody, {
              projects: numberFmt(data.overview.projectCount),
              units: numberFmt(data.overview.unitCount),
              emirates: numberFmt(data.overview.emiratesCovered),
              transactions: numberFmt(data.overview.dldTransactions),
              area: numberFmt(data.overview.dldAreaCount),
            })}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              testId="market-overview"
              value={numberFmt(data.overview.projectCount)}
              label={t.statProjects}
              hint={t.statProjectsHint}
            />
            <Stat value={numberFmt(data.overview.unitCount)} label={t.statUnits} hint={t.statUnitsHint} />
            <Stat value={numberFmt(data.overview.developerCount)} label={t.statDevelopers} hint={t.statDevelopersHint} />
            <Stat
              value={numberFmt(data.overview.dldTransactions)}
              label={t.statTransactions}
              hint={interpolate(t.statTransactionsHint, { period: data.dldPeriod })}
            />
            <Stat value={numberFmt(data.overview.emiratesCovered)} label={t.statEmirates} hint={t.statEmiratesHint} />
            <Stat
              value={formatPrice(data.overview.entryPrice, "AED", { compact: true })}
              label={t.statEntry}
              hint={t.statEntryHint}
            />
          </div>
        </Section>

        {/* 2 — Top communities by gross rental yield */}
        {data.yields.length > 0 ? (
          <Section title={t.yieldsTitle}>
            <p className="max-w-3xl text-muted">
              {interpolate(t.yieldsBody, { period: data.dldPeriod })}
            </p>
            <TableScroll>
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-xs text-muted-light">
                    <th className="px-3 py-2 text-start font-medium">{t.colCommunity}</th>
                    <th className="px-3 py-2 text-start font-medium">{t.colYield}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.colReport}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.yields.map((row) => (
                    <tr key={row.name} data-testid="yield-row" className="border-t border-border">
                      <td className="px-3 py-2.5 font-semibold text-text-dark">
                        {row.slug ? (
                          <Link href={lp(`/communities/${row.slug}`)} className="hover:text-brand">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums font-semibold text-brand">
                            {row.grossYieldPct}%
                          </span>
                          <span
                            aria-hidden
                            className="hidden h-2 rounded-full bg-brand/70 sm:block"
                            style={{ width: `${Math.max(8, (row.grossYieldPct / maxYield) * 160)}px` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-end">
                        {row.hasReport && row.slug ? (
                          <Link
                            href={`/reports/market/${row.slug}`}
                            className="text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            {t.viewReport}
                          </Link>
                        ) : (
                          <span className="text-muted-light">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Section>
        ) : null}

        {/* 3 — Communities by 2025 price trend */}
        {data.gainers.length > 0 || data.decliners.length > 0 ? (
          <Section title={t.trendTitle}>
            <p className="max-w-3xl text-muted">
              {interpolate(t.trendBody, { period: data.dldPeriod })}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {data.gainers.length > 0 ? (
                <TrendTable title={t.gainersTitle} rows={data.gainers} dict={t} lp={lp} positive />
              ) : null}
              {data.decliners.length > 0 ? (
                <TrendTable title={t.declinersTitle} rows={data.decliners} dict={t} lp={lp} positive={false} />
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* 4 — Entry points by emirate & type */}
        <Section title={t.pricingTitle}>
          <p className="max-w-3xl text-muted">{t.pricingBody}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="section-eyebrow mb-3">{t.byEmirateTitle}</h3>
              <TableScroll>
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-light">
                      <th className="px-3 py-2 text-start font-medium">{t.colEmirate}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colUnits}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colFrom}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colMedian}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.emiratePrices.map((row) => (
                      <tr key={row.label} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold text-text-dark">{row.label}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-muted">{numberFmt(row.units)}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-text-dark">
                          {formatPrice(row.minPrice, "AED", { compact: true })}
                        </td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-muted">
                          {formatPrice(row.medianPrice, "AED", { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </div>
            <div>
              <h3 className="section-eyebrow mb-3">{t.byTypeTitle}</h3>
              <TableScroll>
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-light">
                      <th className="px-3 py-2 text-start font-medium">{t.colType}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colUnits}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colFrom}</th>
                      <th className="px-3 py-2 text-end font-medium">{t.colMedian}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.typePrices.map((row) => (
                      <tr key={row.type} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold text-text-dark">{typeLabel(row.type)}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-muted">{numberFmt(row.units)}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-text-dark">
                          {formatPrice(row.minPrice, "AED", { compact: true })}
                        </td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-muted">
                          {formatPrice(row.medianPrice, "AED", { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </div>
          </div>
        </Section>

        {/* 5 — Most active developers */}
        {data.developers.length > 0 ? (
          <Section title={t.developersTitle}>
            <p className="max-w-3xl text-muted">{t.developersBody}</p>
            <TableScroll>
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-xs text-muted-light">
                    <th className="px-3 py-2 text-start font-medium">{t.colDeveloper}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.colProjects}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.colUnits}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.developers.map((row) => (
                    <tr key={row.slug} className="border-t border-border">
                      <td className="px-3 py-2.5 font-semibold text-text-dark">
                        <Link href={lp(`/developers/${row.slug}`)} className="hover:text-brand">
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-end tabular-nums text-brand font-semibold">
                        {numberFmt(row.projectCount)}
                      </td>
                      <td className="px-3 py-2.5 text-end tabular-nums text-muted">{numberFmt(row.unitCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Section>
        ) : null}

        {/* 6 — Handover pipeline by year (reuses server-safe TrendChart) */}
        {data.handover.length > 1 ? (
          <Section title={t.handoverTitle}>
            <p className="max-w-3xl text-muted">{t.handoverBody}</p>
            <TrendChart
              className="mt-6"
              height={160}
              ariaLabel={`${t.handoverTitle} — ${data.year}`}
              points={data.handover.map((h) => ({
                label: h.label,
                value: h.count,
                title: `${h.label}: ${numberFmt(h.count)}`,
              }))}
            />
            <TableScroll>
              <table className="mt-4 w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="text-xs text-muted-light">
                    <th className="px-3 py-2 text-start font-medium">{t.colYear}</th>
                    <th className="px-3 py-2 text-end font-medium">{t.colCompleting}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.handover.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-3 py-2.5 font-semibold text-text-dark">{row.label}</td>
                      <td className="px-3 py-2.5 text-end tabular-nums text-muted">{numberFmt(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Section>
        ) : null}

        {/* 7 — Detailed community reports (link out to the gated per-community pages) */}
        {data.reportLinks.length > 0 ? (
          <Section title={t.reportsTitle}>
            <p className="max-w-3xl text-muted">{t.reportsBody}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.reportLinks.map((r) => (
                <Link
                  key={r.slug}
                  href={`/reports/market/${r.slug}`}
                  className="iop-btn-press focus-ring rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-text-dark transition hover:border-brand hover:text-brand"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </Section>
        ) : null}

        {/* Explore / internal links */}
        <Section title={t.exploreTitle}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ExploreLink href={lp("/communities")} label={t.exploreCommunities} />
            <ExploreLink href={lp("/developers")} label={t.exploreDevelopers} />
            <ExploreLink href={lp("/tools")} label={t.exploreTools} />
            <ExploreLink href={lp("/projects")} label={t.exploreProjects} />
          </div>
        </Section>

        {/* Methodology + sources + honest caveats */}
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            {t.methodologyTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {interpolate(t.methodologyBody, {
              source: data.dldSource,
              period: data.dldPeriod,
              date: dateStr,
            })}
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-light">
            {t.sourceLabel}: {data.dldSource}
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            {t.caveatsTitle}
          </h3>
          <ul className="mt-3 max-w-3xl list-disc space-y-1.5 ps-5 text-xs leading-relaxed text-muted-light">
            <li>{t.caveat1}</li>
            <li>{t.caveat2}</li>
            <li>{t.caveat3}</li>
            <li>{t.caveat4}</li>
          </ul>
        </section>
      </main>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
        {title}
        <span className="text-brand">.</span>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({
  value,
  label,
  hint,
  testId,
}: {
  value: string;
  label: string;
  hint: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="rounded-2xl border border-border bg-white p-5 shadow-elevation-sm">
      <p className="font-display text-2xl font-semibold tabular-nums text-brand md:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-text-dark">{label}</p>
      <p className="mt-0.5 text-xs text-muted-light">{hint}</p>
    </div>
  );
}

function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 overflow-x-auto">{children}</div>;
}

function TrendTable({
  title,
  rows,
  dict,
  lp,
  positive,
}: {
  title: string;
  rows: Array<{ name: string; appreciationPct: number; saleSample: number; slug: string | null }>;
  dict: T;
  lp: (href: string) => string;
  positive: boolean;
}) {
  return (
    <div>
      <h3 className="section-eyebrow mb-3">{title}</h3>
      <TableScroll>
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="text-xs text-muted-light">
              <th className="px-3 py-2 text-start font-medium">{dict.colCommunity}</th>
              <th className="px-3 py-2 text-end font-medium">{dict.colChange}</th>
              <th className="px-3 py-2 text-end font-medium">{dict.colSales}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-border">
                <td className="px-3 py-2.5 font-semibold text-text-dark">
                  {row.slug ? (
                    <Link href={lp(`/communities/${row.slug}`)} className="hover:text-brand">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                <td
                  className={`px-3 py-2.5 text-end font-semibold tabular-nums ${
                    positive ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {changeLabel(row.appreciationPct)}
                </td>
                <td className="px-3 py-2.5 text-end tabular-nums text-muted-light">
                  {numberFmt(row.saleSample)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}

function ExploreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="iop-btn-press focus-ring flex items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
    >
      {label}
      <span aria-hidden className="text-brand">
        →
      </span>
    </Link>
  );
}
