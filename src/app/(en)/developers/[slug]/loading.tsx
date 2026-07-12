import { PageShell } from "@/components/page-shell";

export default function DeveloperDetailLoading() {
  return (
    <PageShell headerVariant="transparent">
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
          <div className="skeleton h-4 w-32 rounded opacity-30" />
          <div className="skeleton mt-4 h-12 w-2/3 max-w-lg rounded-xl opacity-40" />
          <div className="skeleton mt-3 h-5 w-56 rounded opacity-30" />
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl opacity-30" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
