const STORAGE_KEY = "iop-favorites";

export const FAVORITES_CHANGED_EVENT = "iop-favorites-changed";

// Set by use-favorites-sync when a session is live. When true, toggles are
// mirrored to /api/me/favorites fire-and-forget — localStorage stays the read
// path and the UI never waits on the network. Errors are swallowed: the next
// sign-in merge reconciles any missed writes.
let signedIn = false;

export function setFavoritesSignedIn(value: boolean): void {
  signedIn = value;
}

function mirrorToServer(slug: string, action: "add" | "remove"): void {
  if (!signedIn || typeof window === "undefined") return;
  void fetch("/api/me/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, action }),
  }).catch(() => {});
}

function notifyFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

export function getFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function setFavoriteSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  notifyFavoritesChanged();
}

export function toggleFavoriteSlug(slug: string): string[] {
  const current = getFavoriteSlugs();
  const removing = current.includes(slug);
  const next = removing ? current.filter((s) => s !== slug) : [...current, slug];
  setFavoriteSlugs(next);
  mirrorToServer(slug, removing ? "remove" : "add");
  return next;
}

export function isFavoriteSlug(slug: string): boolean {
  return getFavoriteSlugs().includes(slug);
}