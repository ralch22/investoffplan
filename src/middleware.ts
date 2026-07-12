import { NextResponse, type NextRequest } from "next/server";
import { PAIR_SEP } from "@/lib/pair-slug";

/**
 * 1) Reverse compare pair URLs (B-vs-A) → alphabetical A-vs-B with 308.
 *    Page-level permanentRedirect is unreliable for SSG reverse static params
 *    under next start / OpenNext; edge middleware is the reliable gate (#243).
 *
 * 2) Stamp Arabic requests so global-not-found can render in-locale (#224).
 *    Edge Middleware is supported on OpenNext Cloudflare. Do NOT use Next 16
 *    `proxy.ts` / Node middleware — OpenNext rejects it.
 */

/** `/compare|compare-projects|compare-developers/{a}-vs-{b}` (optional /ar). */
const COMPARE_PAIR =
  /^(\/ar)?(\/(?:compare-projects|compare-developers|compare)\/)([^/]+)$/;

function canonicalizeComparePath(pathname: string): string | null {
  const m = pathname.match(COMPARE_PAIR);
  if (!m) return null;
  const pair = m[3];
  if (!pair.includes(PAIR_SEP)) return null;
  // Alphabetical order of the two sides = canonical (matches pairSlug helpers).
  const idx = pair.indexOf(PAIR_SEP);
  if (idx <= 0) return null;
  const a = pair.slice(0, idx);
  const b = pair.slice(idx + PAIR_SEP.length);
  if (!a || !b || a === b) return null;
  const canonical = [a, b].sort().join(PAIR_SEP);
  if (canonical === pair) return null;
  return `${m[1] ?? ""}${m[2]}${canonical}`;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const canonical = canonicalizeComparePath(pathname);
  if (canonical) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const headers = new Headers(request.headers);
    headers.set("x-iop-locale", "ar");
    headers.set("x-iop-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ar",
    "/ar/:path*",
    // Reverse-pair redirects (pair segment must contain -vs-; units hub is a no-op).
    "/compare/:pair",
    "/compare-projects/:pair",
    "/compare-developers/:pair",
    "/ar/compare/:pair",
    "/ar/compare-projects/:pair",
    "/ar/compare-developers/:pair",
  ],
};
