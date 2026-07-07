import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { DevelopersDirectory } from "@/components/developers-directory";
import { TopDevelopersChart } from "@/components/top-developers-chart";
import { getDeveloperCityCounts, getDevelopers } from "@/lib/catalog";
import { getHeroImage } from "@/lib/area-images";

export const metadata: Metadata = {
  title: "Top Real Estate Developers in UAE",
  description:
    "Browse UAE off-plan developers with logos, founding year, project counts, and live inventory across Dubai, Abu Dhabi, Sharjah, and more.",
};

export default async function DevelopersPage() {
  const [developers, cityCounts, heroImage] = await Promise.all([
    getDevelopers(),
    getDeveloperCityCounts(),
    getHeroImage(),
  ]);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Top Real Estate Developers in UAE"
        subtitle={`${developers.length.toLocaleString()} developers with live off-plan stock`}
        imageUrl={heroImage}
        align="center"
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <TopDevelopersChart developers={developers} />

        <div className="mt-12">
          <Suspense fallback={<p className="text-muted">Loading developers…</p>}>
            <DevelopersDirectory developers={developers} cityCounts={cityCounts} />
          </Suspense>
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