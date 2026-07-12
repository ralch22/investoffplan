import { NextResponse, type NextRequest } from "next/server";

/**
 * Stamps Arabic requests so the global 404 document (app/global-not-found.tsx)
 * can render in-locale. Both root layouts live inside route groups — (en) and
 * (ar)/ar — so unmatched URLs land on global-not-found with no pathname unless
 * we forward one via a request header.
 *
 * Edge Middleware (this file) is supported on OpenNext Cloudflare. Do NOT use
 * Next 16 `proxy.ts` / Node.js middleware — OpenNext rejects it and blocks
 * Workers deploy (see #178 / vault [[iop-bughunt-loop]]).
 *
 * Matcher is scoped to /ar so English traffic never pays the hop.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-iop-locale", "ar");
  // Also forward the path so global-not-found can prefer URL over Accept-Language
  // even if a future change drops the locale stamp.
  headers.set("x-iop-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/ar", "/ar/:path*"],
};
