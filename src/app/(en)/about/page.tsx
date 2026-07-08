import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ContactCta } from "@/components/contact-cta";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getHeroImage } from "@/lib/area-images";
import { getSiteStats } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Meet the team behind invest off-plan — UAE off-plan intelligence with brochures, compare, and unit-level pricing.",
  alternates: {
    canonical: `${getSiteUrl()}/about`,
    languages: {
      en: `${getSiteUrl()}/about`,
      ar: `${getSiteUrl()}/ar/about`,
    },
  },
};

export default async function AboutPage() {
  const heroImage = await getHeroImage();
  const stats = await getSiteStats();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Specialists in Off-Plan Property"
        italicTitle
        subtitle="Learn About The Invest Off-Plan Team."
        imageUrl={heroImage}
      >
        <PrimaryButton href="/projects">Get Started</PrimaryButton>
      </PageHero>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
        <h2 className="font-display text-3xl font-semibold text-text-dark">
          About <em className="italic">Invest Off&#8209;Plan.</em>
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted">
          We built invest off-plan to give UAE buyers a single place to browse every
          off-plan unit, download brochures, compare payment plans, and explore projects
          on a live map — with price-per-sqft intelligence that goes beyond traditional
          property portals.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Catalog Intelligence",
              role: `${stats.unitCount.toLocaleString("en-US")} unit options`,
            },
            { name: "Brochure Access", role: "PDF + WhatsApp fallback" },
            { name: "Compare Tools", role: "Up to 3 units" },
            { name: "Market Insights", role: "Live analytics" },
          ].map((member) => (
            <div
              key={member.name}
              className="rounded-2xl border border-border bg-surface-alt p-6"
            >
              <div className="flex h-24 items-center justify-center rounded-xl bg-brand/10 text-2xl font-bold text-brand">
                IOP
              </div>
              <p className="mt-4 font-semibold text-text-dark">{member.name}</p>
              <p className="mt-1 text-sm text-muted">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold">
            Client Experiences<span className="text-brand">.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">
            Buyers use invest off-plan to shortlist launches faster — with brochures,
            handover dates, and unit-level pricing in one workflow.
          </p>
        </div>
      </section>

      <ContactCta />
    </PageShell>
  );
}