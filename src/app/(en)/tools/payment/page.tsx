import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PaymentToolPicker } from "@/components/payment-tool-picker";
import { getCatalogApi } from "@/lib/catalog";
import { enMeta } from "@/lib/ar-meta";
import { hasPaymentPlan } from "@/lib/investment-metrics";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Off-Plan Payment Plan Calculator — Dubai",
  description:
    "Model down-payment and construction installments for UAE off-plan projects.",
  alternates: enMeta("/tools/payment"),
};

export async function PaymentPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.paymentPage;
  const api = await getCatalogApi();
  const samples = api.projects
    .filter((p) => hasPaymentPlan(p.paymentPlan) && p.units.length)
    .slice(0, 40);

  return (
    <PageShell headerVariant="transparent">
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-14 pt-24 md:px-8 md:pb-16 md:pt-32">
          <h1 className="font-display text-3xl font-semibold md:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-3 max-w-xl text-white/90">
            {t.heroSubtitle}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <PaymentToolPicker projects={samples} />
      </main>
    </PageShell>
  );
}

export default async function PaymentToolPage() {
  return <PaymentPageContent />;
}
