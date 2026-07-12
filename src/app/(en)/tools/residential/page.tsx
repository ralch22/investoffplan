import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocaleLink } from "@/components/locale-link";
import { ResidentialInsightsTable } from "@/components/residential-insights-table";
import { getResidentialBuildings } from "@/lib/residential-insights";
import { getAreas } from "@/lib/catalog";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary, interpolate } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Residential Insights — Launch Prices & AED/sqft",
  description:
    "Launch-price intelligence per off-plan project — averages, price per sqft, and links to full PDPs.",
  alternates: enMeta("/tools/residential"),
};

interface PageProps {
  searchParams: Promise<{ area?: string; q?: string; city?: string }>;
}

export async function ResidentialPageContent({
  locale = "en",
  searchParams,
}: {
  locale?: Locale;
  searchParams?: Promise<{ area?: string; q?: string; city?: string }>;
}) {
  const dict = getDictionary(locale);
  const t = dict.tools.residentialPage;
  const params = (await searchParams) ?? {};
  const heroImage = await getHeroImage();
  const areas = await getAreas();
  const buildings = await getResidentialBuildings({
    areaSlug: params.area,
    city: params.city,
    query: params.q,
    limit: 100,
  });

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.dataToolkit, href: "/tools" },
            { label: dict.nav.residentialInsights },
          ]}
        />

        <form
          className="mt-8 flex flex-wrap items-end gap-4"
          method="get"
          action={localePath(locale, "/tools/residential")}
        >
          <label className="block text-sm">
            <span className="font-medium text-text-dark">{t.searchLabel}</span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder={t.searchPlaceholder}
              className="iop-input mt-1 min-w-[200px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-text-dark">{t.areaLabel}</span>
            <select name="area" defaultValue={params.area ?? ""} className="iop-input mt-1">
              <option value="">{t.allAreas}</option>
              {areas.slice(0, 80).map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            {dict.common.filter}
          </button>
          {(params.area || params.q) ? (
            <LocaleLink href="/tools/residential" className="text-sm font-semibold text-brand">
              {dict.common.clearFilters}
            </LocaleLink>
          ) : null}
        </form>

        <p className="mt-4 text-sm text-muted">
          {interpolate(t.showingCount, { count: buildings.length })}
        </p>

        <div className="mt-6">
          <ResidentialInsightsTable buildings={buildings} />
        </div>
      </main>
    </PageShell>
  );
}

export default async function ResidentialInsightsPage({ searchParams }: PageProps) {
  return <ResidentialPageContent searchParams={searchParams} />;
}
