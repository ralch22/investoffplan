import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Areas",
  description:
    "Explore off-plan projects by area — Downtown Dubai, Marina, Palm Jumeirah, and more.",
};
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getAreas } from "@/lib/catalog";
import { areaTagline } from "@/lib/figma-copy";
import { getAreaImage, getHeroImage } from "@/lib/area-images";

export default async function AreasPage() {
  const areas = (await getAreas()).slice(0, 6);
  const heroImage = await getHeroImage();
  const areasWithImages = await Promise.all(
    areas.map(async (area) => ({
      area,
      imageUrl: await getAreaImage(area.name),
    })),
  );

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="The Key Areas"
        subtitle="Explore Dubai's Top Areas"
        imageUrl={heroImage}
      />

      <section className="relative z-10 -mt-10 mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="rounded-2xl border-t-4 border-brand bg-white p-6 shadow-xl md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-dark">The Key Areas</h2>
            <Link href="/projects" className="text-sm font-semibold text-brand">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {areasWithImages.map(({ area, imageUrl }) => (
                <Link
                  key={area.slug}
                  href={`/areas/${area.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-white"
                >
                  <div className="relative h-44">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={area.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-full bg-surface-alt" />
                    )}
                    <div className="card-photo-overlay absolute inset-0" />
                  </div>
                  <div className="p-5">
                    <p className="font-semibold text-text-dark group-hover:text-brand">
                      {area.name}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {areaTagline(area.slug, area.name)}
                    </p>
                    <span className="mt-4 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
                      View
                    </span>
                  </div>
                </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
            Community insights<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Browse areas by lifestyle — family-friendly, waterfront, urban, golf, and more —
            like Property Finder DataGuru, powered by our off-plan catalog.
          </p>
          <PrimaryButton href="/tools/communities" className="mt-6">
            Explore by lifestyle
          </PrimaryButton>
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Search The Map<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            Explore communities with launch-price tiers or project pins — two map views for
            budget and inventory.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href="/tools/price-map">Price map</PrimaryButton>
            <PrimaryButton href="/map" variant="ghost" showArrow={false}>
              Project map
            </PrimaryButton>
          </div>
        </div>
      </section>
    </PageShell>
  );
}