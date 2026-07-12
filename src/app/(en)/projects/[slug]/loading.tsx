import { PageShell } from "@/components/page-shell";

// Scoped to /projects/[slug] so the PDP's Suspense fallback matches its own
// chrome (mobileDock="cta") instead of inheriting the SERP loading skeleton,
// which rendered a bottom tab bar that collides with the PDP CTA bar.
export default function ProjectDetailLoading() {
  return (
    <PageShell headerVariant="transparent" mobileDock="cta" showAdvisor={false}>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
          <div className="skeleton h-4 w-32 rounded opacity-30" />
          <div className="skeleton mt-4 h-12 w-3/4 max-w-xl rounded-xl opacity-40" />
          <div className="skeleton mt-3 h-5 w-48 rounded opacity-30" />
          <div className="mt-6 flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-32 rounded-xl opacity-30" />
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="skeleton h-6 w-40 rounded opacity-30" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl opacity-30" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
