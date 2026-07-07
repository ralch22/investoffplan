import { withCatalogDb } from "@/lib/db/api-response";
import { fetchCatalogLite } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return withCatalogDb(async (db) => {
    const payload = await fetchCatalogLite(db);
    if (!payload) {
      throw new Error("Catalog lite payload unavailable");
    }
    return payload;
  });
}