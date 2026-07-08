import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RentVsBuyCalculator } from "@/components/rent-vs-buy-calculator";
import { getHeroImage } from "@/lib/area-images";

export const metadata: Metadata = {
  title: "Rent vs buy calculator",
  description:
    "Compare monthly payments and long-term costs of renting versus buying property in the UAE.",
};

export default async function RentVsBuyPage() {
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Rent vs buy calculator"
        subtitle="See how renting or buying impacts your finances — monthly payments and long-term position."
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Data toolkit", href: "/tools" },
            { label: "Rent vs buy" },
          ]}
        />
        <div className="mt-8">
          <RentVsBuyCalculator />
        </div>
      </main>
    </PageShell>
  );
}