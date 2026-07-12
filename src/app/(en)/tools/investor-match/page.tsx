import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InvestorMatchQuiz } from "@/components/investor-match-quiz";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Investor Match — Find Your Off-Plan Fit",
  description:
    "Answer 6 quick questions and get a ranked shortlist of UAE off-plan projects matched to your budget, goal, and lifestyle.",
  alternates: enMeta("/tools/investor-match"),
};

export async function InvestorMatchPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.investorMatch;
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.dataToolkit, href: "/tools" },
            { label: t.breadcrumb },
          ]}
        />
        <div className="mt-10">
          <InvestorMatchQuiz />
        </div>
      </main>
    </PageShell>
  );
}

export default async function InvestorMatchPage() {
  return <InvestorMatchPageContent />;
}
