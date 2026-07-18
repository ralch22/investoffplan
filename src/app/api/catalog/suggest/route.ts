import { withCatalogDb } from "@/lib/db/api-response";
import { getCatalogApi } from "@/lib/catalog";
import { buildSuggestIndex } from "@/lib/suggest-index";

export const dynamic = "force-dynamic";

/**
 * Minimal search-suggest payload — projects/communities/developers with
 * precomputed match norms, none of the unit/gallery/payment bulk. ~10× smaller
 * than /api/catalog/lite, which is what makes first-keystroke suggestions
 * instant instead of gating on a multi-MB download (see catalog-browser.ts).
 * Served through the same isolate-cached catalog + edge Cache API as lite.
 */
export async function GET(request: Request) {
  return withCatalogDb(
    async () => {
      const api = await getCatalogApi();
      return buildSuggestIndex(api);
    },
    { request },
  );
}
