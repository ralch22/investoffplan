import { withCatalogDb } from "@/lib/db/api-response";
import { fetchMapPayload } from "@/lib/db/catalog-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return withCatalogDb(async (db) => {
    const payload = await fetchMapPayload(db);
    if (!payload) {
      throw new Error("Catalog map payload unavailable");
    }
    return payload;
  });
}