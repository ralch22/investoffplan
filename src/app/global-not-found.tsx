import Link from "next/link";
import { headers } from "next/headers";
import { IBM_Plex_Sans_Arabic, Inter, PT_Serif } from "next/font/google";
import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/ui/primary-button";
import { localePath, type Locale } from "@/i18n/config";
import "./globals.css";

/**
 * Global 404 document (experimental.globalNotFound).
 *
 * Why this exists: both root layouts live inside route groups — (en) and
 * (ar)/ar — so Next's 404 render tree (which only looks at root-segment
 * components) has no layout and used to fall back to the bare
 * `<html id="__next_error__">` shell with no lang/dir. This file IS the root
 * layout for unmatched URLs, so a 404 renders inside a proper document with a
 * real 404 status (the old (en)/[...not-found] and (ar)/ar/[...not-found]
 * catch-alls are gone; unmatched URLs land here directly).
 *
 * Locale detection (prefer path over Accept-Language — issue #224):
 * 1. `x-iop-locale` / `x-iop-pathname` stamped by Edge `src/middleware.ts`
 *    on `/ar` (OpenNext supports Edge Middleware; Node `proxy.ts` does not).
 * 2. Other path-bearing headers Next/host may expose (`x-invoke-path`,
 *    `x-matched-path`, `next-url`, `x-url`, `x-forwarded-uri`).
 * 3. Accept-Language fallback (Arabic-preferring browsers → AR).
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const COPY = {
  en: {
    title: "Page not found | invest off-plan",
    description:
      "This page could not be found. Browse UAE off-plan projects on invest off-plan.",
    ogLocale: "en_AE",
    heading: "Page not found",
    body:
      "This project, area, or developer may not be in our catalog yet. Try searching the full inventory instead.",
    browse: "Browse projects",
    home: "Back home",
  },
  ar: {
    title: "الصفحة غير موجودة | invest off-plan",
    description:
      "تعذّر العثور على هذه الصفحة. تصفّح مشاريع العقارات على الخارطة في الإمارات على invest off-plan.",
    ogLocale: "ar_AE",
    heading: "الصفحة غير موجودة",
    body:
      "قد لا يكون هذا المشروع أو المنطقة أو المطوّر ضمن كتالوجنا بعد. جرّب البحث في المخزون الكامل بدلاً من ذلك.",
    browse: "تصفّح المشاريع",
    home: "العودة للرئيسية",
  },
} as const;

/** True when a path string is under the Arabic tree (`/ar` or `/ar/...`). */
function pathIsArabic(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Strip query/hash and tolerate absolute URLs.
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

function localeFromHeaders(requestHeaders: Headers): Locale {
  // 1. Explicit stamp from Edge middleware (authoritative for /ar/*).
  if (requestHeaders.get("x-iop-locale") === "ar") return "ar";
  if (pathIsArabic(requestHeaders.get("x-iop-pathname"))) return "ar";

  // 2. Path-bearing headers when middleware did not run (local/edge variants).
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

  // 3. Accept-Language fallback (no path signal).
  const acceptLanguage = requestHeaders.get("accept-language") ?? "";
  return /(^|,|\s)ar\b/i.test(acceptLanguage) ? "ar" : "en";
}

export default async function GlobalNotFound() {
  const requestHeaders = await headers();
  const locale = localeFromHeaders(requestHeaders);
  const t = COPY[locale];

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${inter.variable} ${ptSerif.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* React hoists these into <head>. */}
        <title>{t.title}</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content={t.description} />
        <meta property="og:locale" content={t.ogLocale} />
        <main className="mx-auto flex min-h-[100vh] max-w-lg flex-col items-center justify-center px-5 py-24 text-center md:px-8">
          <BrandLogo variant="icon-red" className="h-14 w-14" />
          <p className="mt-6 text-6xl font-semibold tabular-nums text-brand">404</p>
          <h1 className="font-display mt-4 text-3xl font-semibold text-text-dark">
            {t.heading}
          </h1>
          <p className="prose-balance mt-3 text-muted">{t.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryButton href={localePath(locale, "/projects")}>
              {t.browse}
            </PrimaryButton>
            <Link
              href={localePath(locale, "/")}
              className="iop-btn-press focus-ring inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
            >
              {t.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
