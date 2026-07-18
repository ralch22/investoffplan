"use client";

import { useEffect, useState } from "react";
import {
  createCatalogApi,
  type CatalogApi,
  type CatalogFile,
  PAGE_SIZE,
  type FlatUnit,
} from "./catalog-core";
import { buildSuggestIndex, type SuggestIndex } from "./suggest-index";

const USE_API = process.env.NEXT_PUBLIC_CATALOG_API === "1";

let catalogPromise: Promise<CatalogApi> | null = null;
let metaPromise: Promise<CatalogMetaFile | null> | null = null;
let suggestPromise: Promise<SuggestIndex> | null = null;

interface CatalogMetaFile {
  scrapedAt: string;
}

async function fetchCatalogMeta(): Promise<CatalogMetaFile | null> {
  const url = USE_API ? "/api/catalog/meta" : "/catalog-meta.json";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CatalogMetaFile;
  } catch {
    return null;
  }
}

/** Meta is fetched once per page load and shared (it version-keys the lite fetch). */
function fetchCatalogMetaOnce(): Promise<CatalogMetaFile | null> {
  if (!metaPromise) {
    metaPromise = fetchCatalogMeta();
  }
  return metaPromise;
}

async function fetchCatalogLiteFile(): Promise<CatalogFile> {
  const url = USE_API ? "/api/catalog/lite" : "/data/catalog-lite.json";
  // Version-keyed client caching: key the request URL on the catalog's
  // scrapedAt so `force-cache` reuses the stored body regardless of max-age.
  // The catalog changes weekly (Monday ingest), so repeat visitors pay zero
  // download until scrapedAt moves — which mints a new URL and busts cleanly.
  // The edge cache keys on `v` too (KEY_PARAMS in api-response.ts), so a new
  // version can never be served a stale body recorded under the old one.
  const meta = await fetchCatalogMetaOnce();
  if (meta?.scrapedAt) {
    try {
      const res = await fetch(`${url}?v=${encodeURIComponent(meta.scrapedAt)}`, {
        cache: "force-cache",
      });
      if (res.ok) return (await res.json()) as CatalogFile;
    } catch {
      // fall through to the unversioned fetch
    }
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load catalog (${res.status})`);
  }
  return (await res.json()) as CatalogFile;
}

async function loadCatalogApi(): Promise<CatalogApi> {
  const data = await fetchCatalogLiteFile();
  return createCatalogApi(data);
}

export function fetchCatalogApi(): Promise<CatalogApi> {
  if (!catalogPromise) {
    catalogPromise = loadCatalogApi();
  }
  return catalogPromise;
}

export function prefetchCatalogApi(): void {
  void fetchCatalogApi().catch(() => undefined);
}

async function fetchSuggestIndexFile(): Promise<SuggestIndex> {
  // The dedicated suggest payload is ~10× smaller than catalog-lite — it is
  // what lets the search boxes suggest instantly instead of waiting on a
  // multi-MB download + parse. Static mode has no prebuilt file, and any
  // failure falls back to deriving the index from the full catalog (the
  // pre-split behavior), so suggestions degrade slow-but-working, never broken.
  if (USE_API) {
    try {
      const res = await fetch("/api/catalog/suggest");
      if (res.ok) return (await res.json()) as SuggestIndex;
    } catch {
      // fall through to the full-catalog fallback
    }
  }
  const api = await fetchCatalogApi();
  return buildSuggestIndex(api);
}

export function fetchSuggestIndex(): Promise<SuggestIndex> {
  if (!suggestPromise) {
    suggestPromise = fetchSuggestIndexFile().catch((err) => {
      suggestPromise = null; // allow a later retry instead of caching failure
      throw err;
    });
  }
  return suggestPromise;
}

export function prefetchSuggestIndex(): void {
  void fetchSuggestIndex().catch(() => undefined);
}

export function useCatalog() {
  const [api, setApi] = useState<CatalogApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const catalog = await fetchCatalogApi();
        if (!active) return;
        setApi(catalog);
        setLoading(false);
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load catalog");
        setLoading(false);
      }
    }

    void hydrate();
    void fetchCatalogMetaOnce();

    return () => {
      active = false;
    };
  }, []);

  return { api, loading, error };
}

export type { FlatUnit };
export { PAGE_SIZE };
