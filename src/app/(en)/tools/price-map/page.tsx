import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getAreaPricePoints } from "@/lib/price-map-data";
import { getHeroImage } from "@/lib/area-images";
import type { PropertyType } from "@/lib/types";
import { PriceMapClient } from "./price-map-client";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Property Price Map — Launch Prices by Community",
  description:
    "Find UAE communities in your budget with an interactive launch-price map. Filter by bedrooms and property type.",
  alternates: enMeta("/tools/price-map"),
  openGraph: {
    title: "Dubai Property Price Map — Launch Prices by Community",
    description: "Find UAE communities in your budget with an interactive launch-price map. Filter by bedrooms and property type.",
    url: "/tools/price-map",
    images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
  },
};

function MapLoading() {
  return <div className="skeleton min-h-[480px] rounded-2xl" />;
}

interface PageProps {
  searchParams: Promise<{ beds?: string; type?: string; city?: string }>;
}

export async function PriceMapPageContent({
  locale = "en",
  searchParams,
}: {
  locale?: Locale;
  searchParams?: Promise<{ beds?: string; type?: string; city?: string }>;
}) {
  const dict = getDictionary(locale);
  const t = dict.tools.priceMapPage;
  const params = (await searchParams) ?? {};
  const beds = params.beds != null && params.beds !== "" ? Number(params.beds) : null;
  const propertyType = (params.type ?? "") as PropertyType | "";
  const heroImage = await getHeroImage();

  const points = await getAreaPricePoints({
    city: params.city,
    beds: Number.isFinite(beds) ? beds : null,
    propertyType: propertyType || undefined,
  });

  const filterLabel =
    beds != null || propertyType
      ? `Filtered by ${beds != null ? (beds === 0 ? "studio" : `${beds} BR`) : ""}${beds != null && propertyType ? " · " : ""}${propertyType || ""}`
      : "All unit types";

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
            { label: dict.nav.priceMap },
          ]}
        />
        <p className="mt-6 text-sm text-muted">
          {points.length} communities · {filterLabel}. Green markers are more affordable;
          red markers trend premium. Click a community to explore projects.
        </p>
        <Suspense fallback={<MapLoading />}>
          <div className="mt-8">
            <PriceMapClient points={points} />
          </div>
        </Suspense>
      </main>
    </PageShell>
  );
}

export default async function PriceMapPage({ searchParams }: PageProps) {
  return <PriceMapPageContent searchParams={searchParams} />;
}
