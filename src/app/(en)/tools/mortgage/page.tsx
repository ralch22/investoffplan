import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MortgageCalculator } from "@/components/mortgage-calculator";
import { MortgagePreapprovalForm } from "@/components/mortgage-preapproval-form";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "UAE Mortgage Calculator & Pre-Approval",
  description:
    "Model UAE mortgage repayments, DLD fees, and cash-to-close — then request free pre-approval from licensed advisers.",
  alternates: enMeta("/tools/mortgage"),
};

export async function MortgagePageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const heroImage = await getHeroImage();
  const t = dict.tools.mortgagePage;

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
            { label: dict.nav.mortgage },
          ]}
        />
        <div className="mt-8">
          <MortgageCalculator />
        </div>

        <section
          id="pre-approval"
          className="mt-14 grid grid-cols-1 gap-8 rounded-2xl border border-border bg-surface-alt p-8 md:grid-cols-2 md:items-center md:p-10"
        >
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-dark">
              {t.preapprovalHeadingBefore}
              <em className="italic">{t.preapprovalHeadingEm}</em>
              {t.preapprovalHeadingAfter}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {t.preapprovalBody}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>• {t.preapprovalBullet1}</li>
              <li>• {t.preapprovalBullet2}</li>
              <li>• {t.preapprovalBullet3}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <MortgagePreapprovalForm />
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default async function MortgagePage() {
  return <MortgagePageContent />;
}
