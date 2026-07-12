"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n";
import { localeFromPathname } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/locale-provider";

/**
 * Root App Router error boundary.
 *
 * Must not rely solely on ambient LocaleProvider: when this boundary replaces
 * the failed segment, the AR layout provider may be unmounted. Resolve locale
 * from the pathname so /ar/* recovery chrome stays Arabic.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const dict = getDictionary(locale);
  const t = dict.errorPage;

  useEffect(() => {
    // Log to an error monitoring service if connected in future.
    console.error(error);
  }, [error]);

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            {t.label}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-text-dark md:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted">{t.body}</p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-muted opacity-60">{error.digest}</p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {t.tryAgain}
            </button>
            <LocaleLink
              href="/"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:bg-surface-alt"
            >
              {t.goHome}
            </LocaleLink>
          </div>
        </div>
      </PageShell>
    </LocaleProvider>
  );
}
