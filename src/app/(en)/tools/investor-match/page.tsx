import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InvestorMatchQuiz } from "@/components/investor-match-quiz";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "Investor Match — Find Your Off-Plan Fit",
  description:
    "Answer 6 quick questions and get a ranked shortlist of UAE off-plan projects matched to your budget, goal, and lifestyle.",
  alternates: enMeta("/tools/investor-match"),
};

export default async function InvestorMatchPage() {
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Investor Match"
        subtitle="Six quick questions. A ranked shortlist of off-plan projects matched to your brief."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Data toolkit", href: "/tools" },
            { label: "Investor Match" },
          ]}
        />
        <div className="mt-10">
          <InvestorMatchQuiz />
        </div>
      </main>
    </PageShell>
  );
}
