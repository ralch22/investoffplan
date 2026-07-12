import Link from "next/link";
import { headers } from "next/headers";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

/** True when a path string is under the Arabic tree (`/ar` or `/ar/...`). */
function pathIsArabic(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  let path = pathname.trim();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    // keep raw
  }
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  return path === "/ar" || path.startsWith("/ar/");
}

/** Mirror global-not-found locale detection so root notFound() paths stay in-locale. */
function localeFromHeaders(requestHeaders: Headers): Locale {
  if (requestHeaders.get("x-iop-locale") === "ar") return "ar";
  if (pathIsArabic(requestHeaders.get("x-iop-pathname"))) return "ar";

  const pathCandidates = [
    requestHeaders.get("x-invoke-path"),
    requestHeaders.get("x-matched-path"),
    requestHeaders.get("next-url"),
    requestHeaders.get("x-url"),
    requestHeaders.get("x-forwarded-uri"),
    requestHeaders.get("x-original-url"),
  ];
  for (const candidate of pathCandidates) {
    if (pathIsArabic(candidate)) return "ar";
  }

  const acceptLanguage = requestHeaders.get("accept-language") ?? "";
  return /(^|,|\s)ar\b/i.test(acceptLanguage) ? "ar" : "en";
}

export default async function NotFound() {
  const requestHeaders = await headers();
  const locale = localeFromHeaders(requestHeaders);
  const t = getDictionary(locale).common;

  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">404</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-text-dark md:text-5xl">
          {t.notFoundHeading}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted">{t.notFoundBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={localePath(locale, "/projects")}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {t.browseProjectsCta}
          </Link>
          <Link
            href={localePath(locale, "/")}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition hover:bg-surface-alt"
          >
            {t.goHome}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
