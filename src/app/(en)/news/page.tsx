import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getNewsArticles } from "@/content/articles";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "UAE Off-Plan Property News & Market Updates",
  description:
    "UAE off-plan market news, launch updates, and developer announcements from invest off-plan.",
  alternates: enMeta("/news"),
};

function formatDate(iso: string, locale: Locale): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    locale === "ar" ? "ar-AE" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

// Also rendered by the /ar mirror with locale="ar" (chrome + RTL come from the
// AR layout's LocaleProvider) — links and dates localize off this prop.
export default async function NewsPage({
  locale = "en",
}: {
  locale?: Locale;
} = {}) {
  const [featured, ...rest] = getNewsArticles();
  const heroImage = await getHeroImage();
  const dict = getDictionary(locale);
  const lp = (href: string) => localePath(locale, href);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={dict.news.heroTitle}
        italicTitle
        subtitle={dict.news.heroSubtitle}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.news },
          ]}
        />

        {featured ? (
          <article
            className="group relative mt-8 overflow-hidden rounded-2xl bg-surface-dark text-white shadow-lg"
            style={{ minHeight: "320px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-surface-darker/95 via-surface-darker/50 to-transparent" />
            <div
              className="relative flex flex-col justify-end p-8 md:p-12"
              style={{ minHeight: "320px" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                {formatDate(featured.publishedAt, locale)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                <Link href={lp(`/news/${featured.slug}`)} className="hover:text-brand">
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85">
                {featured.description}
              </p>
              <Link
                href={lp(`/news/${featured.slug}`)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-white"
              >
                {dict.news.readMore} <span aria-hidden className="rtl:-scale-x-100">→</span>
              </Link>
            </div>
          </article>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <article
              key={article.slug}
              className="group relative overflow-hidden rounded-2xl bg-surface-dark text-white shadow-sm"
              style={{ minHeight: "220px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-surface-darker/95 via-surface-darker/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {formatDate(article.publishedAt, locale)}
                </p>
                <h3 className="mt-1 text-lg font-semibold leading-snug">
                  <Link href={lp(`/news/${article.slug}`)} className="hover:text-brand">
                    {article.title}
                  </Link>
                </h3>
                <Link
                  href={lp(`/news/${article.slug}`)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-white"
                >
                  {dict.news.readMore} <span aria-hidden className="rtl:-scale-x-100">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
