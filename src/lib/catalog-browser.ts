"use client";

import { useEffect, useState } from "react";
import {
  createCatalogApi,
  type CatalogApi,
  type CatalogFile,
  PAGE_SIZE,
  type FlatUnit,
} from "./catalog-core";

const USE_API = process.env.NEXT_PUBLIC_CATALOG_API === "1";

let catalogPromise: Promise<CatalogApi> | null = null;

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

async function fetchCatalogLiteFile(): Promise<CatalogFile> {
  const url = USE_API ? "/api/catalog/lite" : "/data/catalog-lite.json";
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
    void fetchCatalogMeta();

    return () => {
      active = false;
    };
  }, []);

  return { api, loading, error };
}

export type { FlatUnit };
export { PAGE_SIZE };