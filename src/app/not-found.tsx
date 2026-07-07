import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { PageShell } from "@/components/page-shell";
import { PrimaryButton } from "@/components/ui/primary-button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page could not be found. Browse UAE off-plan projects on invest off-plan.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell>
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-24 text-center md:px-8">
        <BrandLogo variant="icon-red" className="h-14 w-14" />
        <p className="mt-6 text-6xl font-semibold tabular-nums text-brand">404</p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-text-dark">
          Page not found
        </h1>
        <p className="prose-balance mt-3 text-muted">
          This project, area, or developer may not be in our catalog yet. Try
          searching the full inventory instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/projects">Browse projects</PrimaryButton>
          <Link
            href="/"
            className="iop-btn-press focus-ring inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
          >
            Back home
          </Link>
        </div>
      </main>
    </PageShell>
  );
}