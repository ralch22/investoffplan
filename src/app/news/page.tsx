import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NEWS_ARTICLES } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";

export const metadata: Metadata = {
  title: "Latest news",
  description:
    "UAE off-plan market news, launch updates, and developer announcements from invest off-plan.",
};

export default async function NewsPage() {
  const [featured, ...rest] = NEWS_ARTICLES;
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Latest News"
        italicTitle
        subtitle="Stay Up-to-Date on The Latest Off-Plan News"
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "News" },
          ]}
        />
        {/* Featured article – large photo-overlay card */}
        <article className="group mt-8 relative overflow-hidden rounded-2xl bg-surface-dark text-white shadow-lg" style={{minHeight: '320px'}}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-darker/95 via-surface-darker/50 to-transparent" />
          <div className="relative p-8 md:p-12 flex flex-col justify-end" style={{minHeight: '320px'}}>
            <h2 className="text-2xl font-semibold md:text-3xl">{featured.title}</h2>
            <p className="mt-4 max-w-2xl text-white/85 text-sm leading-relaxed">{featured.excerpt}</p>
            <Link href="/insights" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-white">
              Read More <span aria-hidden>→</span>
            </Link>
          </div>
        </article>

        {/* Grid of remaining articles */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {rest.map((article) => (
            <article
              key={article.title}
              className="group relative overflow-hidden rounded-2xl bg-surface-dark text-white shadow-sm"
              style={{minHeight: '220px'}}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-surface-darker/95 via-surface-darker/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h3 className="text-lg font-semibold leading-snug">{article.title}</h3>
                <Link
                  href="/insights"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-white"
                >
                  Read More <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}