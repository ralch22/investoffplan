import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqAccordion } from "@/components/faq-accordion";
import { PrimaryButton } from "@/components/ui/primary-button";
import { FAQ_TOPICS, getFaqTopic } from "@/content/faq";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return FAQ_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getFaqTopic(slug);
  if (!topic) return { title: "FAQ not found" };

  return {
    title: `${topic.title} — FAQ`,
    description: topic.description,
    alternates: { canonical: `${getSiteUrl()}/faq/${slug}` },
  };
}

export default async function FaqTopicPage({ params }: PageProps) {
  const { topic: slug } = await params;
  const topic = getFaqTopic(slug);
  if (!topic) notFound();

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
            {topic.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {topic.description}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand" />
        </div>
      </section>

      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "FAQ", href: "/faq" },
            { label: topic.title },
          ]}
        />

        <div className="mt-8">
          <FaqAccordion faqs={topic.faqs} />
        </div>

        <div className="mt-12 rounded-2xl bg-brand p-8 text-center text-white">
          <p className="text-xl font-semibold">Still deciding? Browse live inventory.</p>
          <PrimaryButton
            href="/projects"
            className="mt-4 bg-white text-brand hover:bg-white/90"
          >
            Browse Projects
          </PrimaryButton>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            More FAQ topics
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {related.map((other) => (
              <Link
                key={other.slug}
                href={`/faq/${other.slug}`}
                className="rounded-2xl border border-border bg-white p-4 text-sm font-semibold text-text-dark transition hover:border-brand hover:text-brand"
              >
                {other.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
