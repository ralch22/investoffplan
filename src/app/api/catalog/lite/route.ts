import { withCatalogDb } from "@/lib/db/api-response";
import { buildLiteFromCatalogFile } from "@/lib/db/catalog-queries";
import { getCatalogFile } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Isolate-cached catalog (zero D1 reads when warm) + edge Cache API — the
  // old path re-read ~13k D1 rows and re-serialized 4.3 MB per request.
  return withCatalogDb(
    async () => {
      const full = await getCatalogFile();
      if (!full) {
        throw new Error("Catalog lite payload unavailable");
      }
      return buildLiteFromCatalogFile(full);
    },
    { request },
  );
}
