import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Browse off-plan projects by developer — Emaar, DAMAC, Sobha, and 100+ UAE builders.",
};
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getDevelopers } from "@/lib/catalog";
import { developerBlurb } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";

export default async function DevelopersPage() {
  const developers = (await getDevelopers()).slice(0, 6);
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="The Developers"
        subtitle="View The Developers in Dubai."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <Link
              key={dev.slug}
              href={`/developers/${dev.slug}`}
              className="rounded-2xl border border-border bg-white p-8 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <p className="text-2xl font-bold uppercase tracking-wide text-text-dark">
                {dev.name}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {developerBlurb(dev.slug)}
              </p>
              <p className="mt-4 text-xs font-medium text-brand">
                {dev.projectCount} projects · {dev.unitCount} units
              </p>
            </Link>
          ))}
        </div>
      </main>

      <section className="bg-surface-darker py-14 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
          <h2 className="font-display max-w-xl text-3xl font-semibold md:text-4xl">
            Book a Consultation with an Off-Plan Expert.
          </h2>
          <PrimaryButton href="/contact">Book a Consultation</PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}