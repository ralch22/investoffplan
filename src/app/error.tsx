"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error monitoring service if connected in future.
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Error</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-text-dark md:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted opacity-60">{error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Try again
          </button>
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
