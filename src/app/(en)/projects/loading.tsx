import { PageShell } from "@/components/page-shell";
import { ProjectsSkeleton } from "@/components/projects-skeleton";

// mobileDock="none": this loading wraps the whole /projects segment incl. the
// [slug] PDP child, so it must not render a bottom tab bar that would leak into
// the PDP's Suspense HTML (the PDP owns its bottom edge with the CTA bar).
export default function ProjectsLoading() {
  return (
    <PageShell headerVariant="transparent" mobileDock="none" showAdvisor={false}>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 text-center md:px-8 md:py-28">
          <div className="skeleton mx-auto h-12 w-64 rounded-xl opacity-40" />
          <div className="skeleton mx-auto mt-4 h-6 w-48 rounded opacity-30" />
        </div>
      </section>
      <ProjectsSkeleton />
    </PageShell>
  );
}