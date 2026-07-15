import { withCatalogDb } from "@/lib/db/api-response";
import { getMapProjectsFromList } from "@/lib/map-data";
import { getCatalogFile } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Isolate-cached catalog (zero D1 reads when warm) + edge Cache API.
  return withCatalogDb(
    async () => {
      const full = await getCatalogFile();
      if (!full) {
        throw new Error("Catalog map payload unavailable");
      }
      return {
        scrapedAt: full.scrapedAt,
        projects: getMapProjectsFromList(full.projects),
      };
    },
    { request },
  );
}
