import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqAccordion } from "@/components/faq-accordion";
import { PrimaryButton } from "@/components/ui/primary-button";
import { FAQ_TOPICS, getFaqTopic } from "@/content/faq";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ topic: string }>;
  locale?: Locale;
}

type TopicChrome = { title: string; description: string };

function topicChrome(locale: Locale, slug: string): TopicChrome | null {
  const topic = getFaqTopic(slug);
  if (!topic) return null;
  const dict = getDictionary(locale);
  const topics = dict.faq.topics as Record<string, TopicChrome>;
  const copy = topics[slug];
  return {
    title: copy?.title ?? topic.title,
    description: copy?.description ?? topic.description,
  };
}

export function generateStaticParams() {
  return FAQ_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const chrome = topicChrome("en", slug);
  if (!chrome) return { title: "FAQ not found" };
  const dict = getDictionary("en");
  const title = `${chrome.title} — ${dict.faq.topicTitleSuffix}`;

  return {
    title,
    description: chrome.description,
    alternates: enMeta(`/faq/${slug}`),
    openGraph: {
      title,
      description: chrome.description,
      images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
    },
  };
}

export default async function FaqTopicPage({ params, locale = "en" }: PageProps) {
  const dict = getDictionary(locale);
  const { topic: slug } = await params;
  const topic = getFaqTopic(slug);
  const chrome = topicChrome(locale, slug);
  if (!topic || !chrome) notFound();

  const topics = dict.faq.topics as Record<string, TopicChrome>;
  const related = FAQ_TOPICS.filter((other) => other.slug !== topic.slug).slice(0, 4);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqPageJsonLd(topic.faqs)),
        }}
      />

      <section className="bg-guide-hero py-16">
        <div className="mx-auto max-w-[800px] px-5 text-center md:px-8">
          <h1 className="font-display text-4xl font-semibold text-text-dark md:text-5xl">
            {chrome.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {chrome.description}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand" />
        </div>
      </section>

      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.faq, href: "/faq" },
            { label: chrome.title },
          ]}
        />

        <div className="mt-8">
          {/* Q&A body stays EN for v1 (content corpus); hub chrome is localized. */}
          <FaqAccordion faqs={topic.faqs} />
        </div>

        <div className="mt-12 rounded-2xl bg-brand p-8 text-center text-white">
          <p className="text-xl font-semibold">{dict.faq.ctaBody}</p>
          <PrimaryButton
            href={localePath(locale, "/projects")}
            className="mt-4 bg-white text-brand hover:bg-white/90"
          >
            {dict.faq.ctaButton}
          </PrimaryButton>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            {dict.faq.moreTopics}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {related.map((other) => {
              const otherChrome = topics[other.slug] ?? {
                title: other.title,
                description: other.description,
              };
              return (
                <Link
                  key={other.slug}
                  href={localePath(locale, `/faq/${other.slug}`)}
                  className="rounded-2xl border border-border bg-white p-4 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
                >
                  {otherChrome.title}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

/** Shared by AR mirror for locale-aware title/description. */
export { topicChrome };
