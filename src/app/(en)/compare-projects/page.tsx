import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getHubProjectPairs } from "@/lib/project-compare";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

/** ISR — same lightweight hub helpers as /compare (no full pair matrix). */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare Off-Plan Projects in Dubai",
  description:
    "Head-to-head comparisons of Dubai off-plan projects — launch price, price per sqft, handover, payment plans, and unit mix.",
  alternates: enMeta("/compare-projects"),
  openGraph: {
    title: "Compare Off-Plan Projects in Dubai",
    description:
      "Head-to-head comparisons of Dubai off-plan projects — price, handover, payment plans, and unit mix.",
    url: "/compare-projects",
    images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
  },
};

/** Enough pairs for a useful index without re-scanning the full catalog. */
const INDEX_PAIR_LIMIT = 36;

export async function CompareProjectsIndexContent({
  locale = "en",
}: {
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const t = dict.pages.compareProjectsIndex;
  const pairs = await getHubProjectPairs(INDEX_PAIR_LIMIT);

  return (
    <PageShell headerVariant="transparent">
      <PageHero title={t.heroTitle} italicTitle subtitle={t.heroSubtitle} />

      <div className="mx-auto max-w-[1200px] px-5 pt-6 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Compare", href: "/compare" },
            { label: t.breadcrumb },
          ]}
        />
      </div>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <p className="section-eyebrow">{t.eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark md:text-3xl">
            {t.heading}
            <span className="text-brand">.</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{t.subtitle}</p>

          {pairs.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pairs.map((p) => (
                <Link
                  key={p.pairSlug}
                  href={localePath(locale, `/compare-projects/${p.pairSlug}`)}
                  className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-4 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
                >
                  <p className="text-sm font-semibold text-text-dark group-hover:text-brand">
                    {p.a} <span className="text-muted-light">vs</span> {p.b}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t.empty}</p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <PrimaryButton href={localePath(locale, "/compare")}>
              {t.backToHub}
            </PrimaryButton>
            <Link
              href={localePath(locale, "/compare-developers")}
              className="text-sm font-medium text-brand underline-offset-2 hover:underline"
            >
              {t.developersLink}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default async function CompareProjectsIndexPage() {
  return <CompareProjectsIndexContent />;
}
