import { PageShell } from "@/components/page-shell";

export default function NewsLoading() {
  return (
    <PageShell showAdvisor={false}>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <div className="skeleton mx-auto h-12 w-56 rounded-xl opacity-40" />
          <div className="skeleton mx-auto mt-4 h-5 w-48 rounded opacity-30" />
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl opacity-30" />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
