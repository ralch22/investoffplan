import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How invest off-plan collects, uses, and protects your contact details and browsing data.",
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <PageHero title="Privacy Policy" subtitle="How we handle your data" align="left" />
      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Privacy policy" },
          ]}
        />
        <div className="prose prose-slate mt-6 max-w-none space-y-4 text-sm leading-relaxed text-muted">
          <p>
            invest off-plan collects contact details you submit through brochure requests,
            consultation forms, and newsletter signups solely to respond to your property
            enquiries.
          </p>
          <p>
            We do not sell personal data. Analytics on the public catalog (search filters,
            compare usage) are aggregated and used to improve the platform experience.
          </p>
          <p>
            For data access or deletion requests, contact iop@investoffplan.com.
          </p>
        </div>
      </main>
    </PageShell>
  );
}