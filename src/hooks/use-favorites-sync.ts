"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import {
  getFavoriteSlugs,
  setFavoriteSlugs,
  setFavoritesSignedIn,
} from "@/lib/favorites";

// Module-level dedupe: PageShell mounts per page, so several instances of this
// hook can be live at once (and remount on navigation). We merge exactly ONCE
// per session token — the first mount to see a fresh token claims it.
let mergedForToken: string | null = null;

async function mergeOnce(token: string): Promise<void> {
  if (mergedForToken === token) return;
  mergedForToken = token;
  try {
    const local = getFavoriteSlugs();
    // Bulk UNION merge: push local slugs up, pull the merged set back down.
    // The POST response already returns the merged list — no separate GET
    // needed unless there was nothing to push.
    const res = local.length
      ? await fetch("/api/me/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: local }),
        })
      : await fetch("/api/me/favorites");
    if (!res.ok) throw new Error(`favorites sync ${res.status}`);
    const data = (await res.json()) as { slugs?: unknown };
    if (Array.isArray(data.slugs)) {
      const merged = data.slugs.filter((s): s is string => typeof s === "string");
      // Only write (and broadcast) when the set actually changed.
      const current = getFavoriteSlugs();
      if (
        merged.length !== current.length ||
        merged.some((s, i) => s !== current[i])
      ) {
        setFavoriteSlugs(merged);
      }
    }
  } catch {
    // Allow a later mount / next navigation to retry.
    if (mergedForToken === token) mergedForToken = null;
  }
}

// Mount once per client shell (PageShell). Safe to mount multiple times —
// merge is deduped module-wide by session token.
export function useFavoritesSync(): void {
  const { data: session } = useSession();
  const token = session?.session?.token ?? null;
  const signedIn = Boolean(session?.user);

  useEffect(() => {
    setFavoritesSignedIn(signedIn);
    if (signedIn && token) {
      void mergeOnce(token);
    }
  }, [signedIn, token]);
}
