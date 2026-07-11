import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ContactCta } from "@/components/contact-cta";
import { ContactForm } from "@/components/contact-form";
import { getHeroImage } from "@/lib/area-images";
import { CONTACT_EMAIL, OFFICE_PHONE_DISPLAY } from "@/lib/contact-info";

export const metadata: Metadata = {
  title: "Contact Us — UAE Off-Plan Property Advice",
  description:
    "Contact invest off-plan for off-plan enquiries, brochures, and consultation across Dubai and the UAE.",
  alternates: {
    canonical: `${getSiteUrl()}/contact`,
    languages: {
      en: `${getSiteUrl()}/contact`,
      ar: `${getSiteUrl()}/ar/contact`,
    },
  },
};

export default async function ContactPage() {
  const heroImage = await getHeroImage();

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Contact Us"
        subtitle="Have Questions or Want to Purchase Your Next Off-Plan Property?"
        imageUrl={heroImage}
      />

      <section className="relative z-10 -mt-12 mx-auto max-w-[720px] px-5 md:px-8">
        <div className="rounded-2xl border-t-4 border-brand bg-white p-8 shadow-xl md:p-10">
          <h2 className="text-2xl font-semibold text-text-dark">
            Tell us what you are looking for
          </h2>
          <p className="mt-2 text-sm text-muted">
            Contact us or message us via WhatsApp, phone, or email.
          </p>
          <p className="mt-3 text-sm font-semibold text-brand">
            <a href={`tel:${OFFICE_PHONE_DISPLAY.replace(/\s/g, "")}`} className="hover:underline">
              {OFFICE_PHONE_DISPLAY}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>

          <ContactForm />
        </div>
      </section>

      <ContactCta />
    </PageShell>
  );
}