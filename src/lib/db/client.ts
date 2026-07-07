import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

export type CatalogDatabase = DrizzleD1Database<typeof schema>;

export async function getDb(): Promise<CatalogDatabase | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.DB) return null;
    return drizzle(env.DB, { schema });
  } catch {
    return null;
  }
}

export function createDb(binding: D1Database): CatalogDatabase {
  return drizzle(binding, { schema });
}