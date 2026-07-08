import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleBody } from "@/components/article-body";
import { FaqAccordion } from "@/components/faq-accordion";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getNewsArticle, getNewsArticles } from "@/content/articles";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getNewsArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticle(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `${getSiteUrl()}/news/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      url: `${getSiteUrl()}/news/${slug}`,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getNewsArticle(slug);
  if (!article) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    mainEntityOfPage: `${siteUrl}/news/${article.slug}`,
    author: { "@type": "Organization", name: "invest off-plan" },
    publisher: { "@type": "Organization", name: "invest off-plan", url: siteUrl },
  };

  const related = getNewsArticles()
    .filter((other) => other.slug !== article.slug)
    .slice(0, 3);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {article.faq && article.faq.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqPageJsonLd(article.faq)),
          }}
        />
      ) : null}

      <section className="bg-guide-hero py-16">
        <div className="mx-auto max-w-[800px] px-5 text-center md:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {formatDate(article.publishedAt)}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-text-dark md:text-5xl">
            {article.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {article.description}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand" />
        </div>
      </section>

      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "News", href: "/news" },
            { label: article.title },
          ]}
        />

        <article className="mt-8">
          <ArticleBody sections={article.sections} />
        </article>

        {article.faq && article.faq.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              Frequently asked questions
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={article.faq} />
            </div>
          </section>
        ) : null}

        <div className="mt-12 rounded-2xl bg-brand p-8 text-center text-white">
          <p className="text-xl font-semibold">
            Explore live off-plan inventory across the UAE.
          </p>
          <PrimaryButton
            href="/projects"
            className="mt-4 bg-white text-brand hover:bg-white/90"
          >
            Browse Projects
          </PrimaryButton>
        </div>

        {related.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              More from the newsroom
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((other) => (
                <Link
                  key={other.slug}
                  href={`/news/${other.slug}`}
                  className="rounded-2xl border border-border bg-white p-5 transition hover:border-brand hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {formatDate(other.publishedAt)}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-text-dark">
                    {other.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
