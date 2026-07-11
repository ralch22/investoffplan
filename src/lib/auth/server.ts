import "server-only";

import { getAuth } from "@/lib/auth";

// For force-dynamic API routes ONLY. Never call from pages/layouts under
// (en)/(ar) — those are ISR/static and must not read request headers.
export async function getSessionFromRequest(req: Request) {
  const auth = await getAuth();
  return auth.api.getSession({ headers: req.headers });
}

export type SessionResult = Awaited<ReturnType<typeof getSessionFromRequest>>;
