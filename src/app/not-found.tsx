import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">404</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-text-dark md:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted">
          We couldn&apos;t find the page you&apos;re looking for. It may have moved or been
          removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/projects"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Browse projects
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:bg-surface-alt"
          >
            Go home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
