import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FAQ_TOPICS } from "@/content/faq";
import { getHeroImage } from "@/lib/area-images";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Off-Plan Property FAQ",
  description:
    "Answers to the questions UAE off-plan buyers ask most — payment plans, escrow, Golden Visa, fees, handover, mortgages, and more.",
  alternates: { canonical: `${getSiteUrl()}/faq` },
};

export default async function FaqHubPage() {
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Frequently Asked Questions"
        italicTitle
        subtitle="Straight answers on buying off-plan in the UAE."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "FAQ" },
          ]}
        />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FAQ_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/faq/${topic.slug}`}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                ?
              </span>
              <h2 className="mt-4 text-lg font-semibold text-text-dark">
                {topic.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {topic.description}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand">
                {topic.faqs.length} answers
              </p>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
