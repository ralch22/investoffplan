import "server-only";

import { getCatalogApi } from "@/lib/catalog";

export async function getAreaImage(areaName: string): Promise<string | undefined> {
  const api = await getCatalogApi();
  return api.projects.find((p) => p.area === areaName)?.imageUrl;
}

export async function getHeroImage(): Promise<string | undefined> {
  const api = await getCatalogApi();
  return api.projects.find((p) => p.imageUrl)?.imageUrl;
}