import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrimaryButton } from "@/components/ui/primary-button";
import { GUIDE_CARDS, GUIDE_REASONS, getGuide } from "@/lib/figma-copy";
import { getGuideBody } from "@/content/articles";
import { ArticleBody } from "@/components/article-body";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}

export function generateStaticParams() {
  return GUIDE_CARDS.filter((g) => g.href.startsWith("/guides/")).map((g) => ({
    slug: g.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.description,
    alternates: enMeta(`/guides/${slug}`),
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: `${getSiteUrl()}/guides/${slug}`,
      images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
    },
  };
}

export default async function GuideDetailPage({ params, locale = "en" }: PageProps) {
  const dict = getDictionary(locale);
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const body = getGuideBody(slug);
  const reasons = GUIDE_REASONS[slug] ?? [
    {
      title: guide.title,
      body: guide.description,
    },
  ];

  const siteUrl = getSiteUrl();

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              { name: "Home", url: siteUrl },
              { name: "Guides", url: `${siteUrl}/guides` },
              { name: guide.title },
            ]),
          ),
        }}
      />
      <section className="bg-guide-hero py-16">
        <div className="mx-auto max-w-[800px] px-5 text-center md:px-8">
          <h1 className="font-display text-4xl font-semibold text-text-dark md:text-5xl">
            {guide.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {guide.description}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand" />
        </div>
      </section>

      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.guides, href: "/guides" },
            { label: guide.title },
          ]}
        />
        {body ? (
          <article className="mt-8">
            <ArticleBody sections={body} />
          </article>
        ) : null}
        <div className="mt-8 space-y-4">
          {reasons.map((reason, index) => {
            const highlighted = index === reasons.length - 1;
            return (
              <article
                key={reason.title}
                className={
                  highlighted
                    ? "rounded-2xl bg-brand p-6 text-white"
                    : "rounded-2xl border border-border bg-white p-6"
                }
              >
                <div className="flex items-start gap-4">
                  <span
                    className={
                      highlighted
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                    }
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{reason.title}</h2>
                    <p
                      className={
                        highlighted
                          ? "mt-2 text-sm leading-relaxed text-white/90"
                          : "mt-2 text-sm leading-relaxed text-muted"
                      }
                    >
                      {reason.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl bg-brand p-8 text-center text-white">
          <p className="text-xl font-semibold">{dict.pages.guides.ctaHeading}</p>
          <PrimaryButton href="/projects" className="mt-4 bg-white text-brand hover:bg-white/90">
            {dict.pages.guides.ctaButton}
          </PrimaryButton>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/guides" className="font-semibold text-brand hover:text-brand-dark">
            {dict.pages.guides.backLink}
          </Link>
        </p>
      </main>
    </PageShell>
  );
}