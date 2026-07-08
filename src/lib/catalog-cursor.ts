/**
 * Opaque cursor pagination for the catalog read API.
 *
 * The catalog is materialized and deterministically sorted per request, so a
 * cursor only needs to encode a resume offset plus a fingerprint (`key`) of the
 * query it belongs to. The key lets the API detect a cursor that was minted for
 * a different filter/sort/view combination (or a since-refreshed catalog) and
 * fall back to the first page instead of silently returning the wrong slice.
 */

export interface CatalogCursor {
  /** Zero-based index into the sorted result list to resume from. */
  offset: number;
  /** Fingerprint of the query the cursor was minted for. */
  key: string;
}

function toBase64Url(input: string): string {
  const b64 = typeof btoa === "function"
    ? btoa(input)
    : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Stable, order-independent-per-field fingerprint of a query. Uses djb2 over a
 * canonical string so it is cheap and deterministic across requests. Not a
 * security boundary — only guards against cross-query cursor reuse.
 */
export function catalogQueryKey(parts: Record<string, unknown>): string {
  const canonical = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${JSON.stringify(parts[k])}`)
    .join("&");
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash + canonical.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function encodeCatalogCursor(offset: number, key: string): string {
  return toBase64Url(JSON.stringify({ o: offset, k: key }));
}

export function decodeCatalogCursor(token: string | null | undefined): CatalogCursor | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as { o?: unknown; k?: unknown };
    const offset = typeof parsed.o === "number" ? parsed.o : Number.NaN;
    const key = typeof parsed.k === "string" ? parsed.k : "";
    if (!Number.isInteger(offset) || offset < 0 || !key) return null;
    return { offset, key };
  } catch {
    return null;
  }
}
