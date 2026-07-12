import { PageShell } from "@/components/page-shell";

export default function GuideDetailLoading() {
  return (
    <PageShell showAdvisor={false}>
      <section className="bg-guide-hero py-16">
        <div className="mx-auto max-w-[800px] px-5 text-center md:px-8">
          <div className="skeleton mx-auto h-10 w-3/4 rounded-xl opacity-40" />
          <div className="skeleton mx-auto mt-4 h-5 w-2/3 rounded opacity-30" />
        </div>
      </section>
      <div className="mx-auto max-w-[800px] px-5 py-12 md:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton mb-6 h-6 w-full rounded opacity-20" />
        ))}
      </div>
    </PageShell>
  );
}
