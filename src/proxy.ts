import { NextResponse, type NextRequest } from "next/server";

/**
 * Stamps Arabic requests so the global 404 document (app/global-not-found.tsx)
 * can render in-locale: with both root layouts inside route groups, the 404
 * render tree has no other way to know which locale the request belongs to.
 * Scoped to /ar so English traffic never pays the proxy hop.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-iop-locale", "ar");
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/ar", "/ar/:path*"] };
