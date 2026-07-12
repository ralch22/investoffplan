import { PageShell } from "@/components/page-shell";

export default function CompareLoading() {
  return (
    <PageShell showAdvisor={false}>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <div className="skeleton mx-auto h-12 w-72 rounded-xl opacity-40" />
          <div className="skeleton mx-auto mt-4 h-5 w-56 rounded opacity-30" />
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="skeleton h-96 w-full rounded-2xl opacity-30" />
      </div>
    </PageShell>
  );
}
