"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

// baseURL omitted on purpose: the client calls same-origin /api/auth/*, which
// works on prod, www, preview, and localhost without any env wiring.
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const { useSession, signIn, signOut } = authClient;
