import { withCatalogDb } from "@/lib/db/api-response";
import { fetchCatalogMeta } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return withCatalogDb(async (db) => {
    const meta = await fetchCatalogMeta(db);
    if (!meta) {
      throw new Error("Catalog meta row missing");
    }
    return meta;
  });
}