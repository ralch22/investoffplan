import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { enMeta } from "@/lib/ar-meta";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "How invest off-plan uses cookies and local storage for favorites, compare, and currency preferences.",
  alternates: enMeta("/cookie-policy"),
};

export default function CookiePolicyPage() {
  return (
    <PageShell>
      <PageHero title="Cookie Policy" subtitle="How we use cookies and local storage" align="left" />
      <main className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Cookie policy" },
          ]}
        />
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            invest off-plan uses essential cookies and browser local storage to remember
            your currency preference, compare selections, and saved favorites.
          </p>
          <p>
            We may use privacy-friendly analytics to understand which pages and filters
            help buyers discover off-plan inventory more efficiently. Alongside Google
            Analytics, we may use Microsoft Clarity to collect anonymised session
            heatmaps that show how visitors interact with our pages.
          </p>
          <p>
            You can clear favorites and compare data at any time through your browser
            settings or by using the Clear controls on the site.
          </p>
        </div>
      </main>
    </PageShell>
  );
}