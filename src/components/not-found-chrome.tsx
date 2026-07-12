"use client";

import { LocaleLink } from "@/components/locale-link";
import { useI18n } from "@/i18n/locale-provider";

/** Client 404 chrome — EN fallback when no LocaleProvider (EN tree). */
export function NotFoundChrome() {
  const { dict } = useI18n();
  const t = dict.common;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-text-dark md:text-5xl">
        {t.notFoundHeading}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base text-muted">{t.notFoundBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <LocaleLink
          href="/projects"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t.browseProjectsCta}
        </LocaleLink>
        <LocaleLink
          href="/"
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:bg-surface-alt"
        >
          {t.goHome}
        </LocaleLink>
      </div>
    </div>
  );
}
