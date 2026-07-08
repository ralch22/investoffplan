import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PrimaryButton } from "@/components/ui/primary-button";
import { GUIDE_CARDS, GUIDE_REASONS, getGuide } from "@/lib/figma-copy";
import { getGuideBody } from "@/content/articles";
import { ArticleBody } from "@/components/article-body";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ slug: string }>;
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
    alternates: { canonical: `${getSiteUrl()}/guides/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: `${getSiteUrl()}/guides/${slug}`,
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
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

  return (
    <PageShell>
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
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
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
          <p className="text-xl font-semibold">Invest in Your Own Off-Plan Property.</p>
          <PrimaryButton href="/projects" className="mt-4 bg-white text-brand hover:bg-white/90">
            Browse Projects
          </PrimaryButton>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/guides" className="font-semibold text-brand hover:text-brand-dark">
            ← All investment guides
          </Link>
        </p>
      </main>
    </PageShell>
  );
}