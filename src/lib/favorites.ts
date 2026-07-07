const STORAGE_KEY = "iop-favorites";

export const FAVORITES_CHANGED_EVENT = "iop-favorites-changed";

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
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  setFavoriteSlugs(next);
  return next;
}

export function isFavoriteSlug(slug: string): boolean {
  return getFavoriteSlugs().includes(slug);
}