import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RentVsBuyCalculator } from "@/components/rent-vs-buy-calculator";
import { getHeroImage } from "@/lib/area-images";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Rent vs Buy Calculator — Dubai Property",
  description:
    "Compare monthly payments and long-term costs of renting versus buying property in the UAE.",
  alternates: enMeta("/tools/rent-vs-buy"),
};

export async function RentVsBuyPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.rentVsBuyPage;
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
            { label: dict.nav.rentVsBuy },
          ]}
        />
        <div className="mt-8">
          <RentVsBuyCalculator />
        </div>
      </main>
    </PageShell>
  );
}

export default async function RentVsBuyPage() {
  return <RentVsBuyPageContent />;
}
