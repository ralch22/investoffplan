import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getAllEditions } from "@/lib/market-report-editions";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary } from "@/i18n";

const LOCALE = "ar";

export function generateMetadata(): Metadata {
  const base = getSiteUrl();
  const url = `${base}/ar/market-report/archive`;
  const dict = getDictionary(LOCALE);
  const t = dict.marketReport;
  return {
    title: t.archiveTitle,
    description: t.archiveSubtitle,
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${base}/market-report/archive`,
        en: `${base}/market-report/archive`,
        ar: url,
      },
    },
  };
}

export default function ArMarketReportArchivePage() {
  const dict = getDictionary(LOCALE);
  const t = dict.marketReport;
  const editions = getAllEditions();
  const base = getSiteUrl();

  return (
    <PageShell headerVariant="transparent">
      <PageHero title={t.archiveTitle} subtitle={t.archiveSubtitle} />

      <main className="mx-auto max-w-[900px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/ar" },
            { label: t.title, href: "/ar/market-report" },
            { label: t.archiveBreadcrumb },
          ]}
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editions.map((edition) => {
            const href = edition.isCurrent
              ? "/ar/market-report"
              : `/ar/market-report/${edition.slug}`;
            return (
              <Link
                key={edition.slug}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-xl font-semibold text-text-dark group-hover:text-brand">
                    {t.title}
                  </p>
                  {edition.isCurrent ? (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                      {t.currentEditionBadge}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-muted">{edition.label}</p>
                <p className="text-xs text-muted-light">
                  {new Date(edition.publishedAt).toLocaleDateString("ar-AE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-auto text-sm font-semibold text-brand">
                  {t.viewEdition}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
