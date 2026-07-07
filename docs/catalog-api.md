# Catalog Read API Contract

InvestOffPlan serves catalog data from Cloudflare D1 via edge API routes. Static JSON (`/data/catalog*.json`) remains the fallback until the frontend switches to these endpoints behind a feature flag.

## Prerequisites

```bash
npm run db:migrate:local      # apply schema to local D1
npm run db:migrate:remote     # apply schema to production D1 (once)
npm run db:seed:local         # full wipe + import data/catalog.json → local D1
npm run db:seed:remote        # export local D1 → remote D1 (requires seed:local first)
npm run db:upsert:local       # merge catalog.json into local D1 (preserves brochures)
npm run db:upsert:remote      # merge catalog.json into remote D1
npm run ingest:catalog        # scrape PF + brochures + sync + upsert (add --remote)
npm run ingest:catalog:smoke  # 2-page scrape smoke test + remote upsert
```

## Automated ingest (GitHub Actions)

Workflow: `.github/workflows/catalog-ingest.yml`

- **Schedule:** Mondays 04:00 UTC
- **Manual:** Actions → Catalog ingest → Run workflow (optional smoke mode)

**Required GitHub repository secrets (for catalog-ingest workflow + production D1 upsert):**
- `CLOUDFLARE_API_TOKEN`
  - Create via Cloudflare dashboard → My Profile → API Tokens.
  - Required permissions:
    - Account > D1:Edit
    - Account > Workers Scripts:Edit (for `wrangler` platform proxy / remote bindings in CI)
  - Scope the token to the account `4a75e91d6fca8bc58467fb80ce1b9c2e`.
- `CLOUDFLARE_ACCOUNT_ID` — `4a75e91d6fca8bc58467fb80ce1b9c2e`

**Optional GitHub repository variables:**
- `IOP_WHATSAPP` — default WhatsApp number written into catalog rows (when a scraped project lacks contact info)

Configure at: repository **Settings > Secrets and variables > Actions**.

The GitHub Actions workflow (`.github/workflows/catalog-ingest.yml`) always passes `--remote` and therefore targets the production D1 (`investoffplan-catalog`) for upserts. Scheduled runs also commit refreshed catalog snapshots back to the repo.

The pipeline runs:
1. `scrape-pf-catalog.ts` — Property Finder unit-view ingest
2. `scrape-pf-brochures.ts --resume` — enrich brochures/metadata (skips existing PDFs)
3. `sync-catalog-public.mjs` — refresh static JSON slices (fallback CDN)
4. `upsert-catalog-to-d1.ts --remote` — merge into D1 without full wipe

Successful scheduled runs commit `data/catalog.json` + `public/data/*` back to the repo.

## Base URL

- Preview: `https://investoffplan-preview.emerge-digital.workers.dev`
- Production: `https://investoffplan.com`

All routes return JSON. Successful responses include:

`Cache-Control: public, max-age=300, stale-while-revalidate=3600`

## Endpoints

### `GET /api/catalog/meta`

Catalog metadata for cache busting and homepage stats.

```json
{
  "version": 2,
  "unitCount": 1501,
  "projectCount": 525,
  "scrapedAt": "2026-07-06T14:14:14.711Z",
  "cityCounts": [{ "slug": "dubai", "label": "Dubai", "count": 1053 }],
  "developerSerpLinks": [{ "title": "...", "path": "/en/new-projects/dev/..." }],
  "devList": [{ "id": "...", "name": "...", "slug": "..." }]
}
```

Replaces: `/catalog-meta.json` + devList slice from `catalog-lite.json`.

---

### `GET /api/catalog/projects`

Paginated, filterable unit/project listings. Query params mirror the projects page URL state.

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | `1` | 1-based |
| `pageSize` | int | `24` | max `100` |
| `view` | `unit` \| `project` | `unit` | project view dedupes by project |
| `sort` | SortOption | `featured` | `price-asc`, `price-desc`, `handover-asc`, `handover-desc`, `value-asc` |
| `collection` | CollectionFilter | `all` | `premium`, `brochure`, `video`, `under-2m`, `studio`, `waterfront` |
| `q` | string | `""` | full-text search |
| `city` | CitySlug | `all` | e.g. `dubai`, `abu-dhabi` |
| `propertyType` | string | `all` | `apartment`, `villa`, etc. |
| `beds` | `all` \| `studio` \| `1-5` | `all` | `5` means 5+ |
| `minPrice` | int | — | AED |
| `maxPrice` | int | — | AED |

Response:

```json
{
  "meta": {
    "page": 1,
    "pageSize": 24,
    "total": 1501,
    "totalPages": 63,
    "view": "unit",
    "sort": "featured",
    "collection": "all",
    "filters": { "query": "", "city": "all", "propertyType": "all", "beds": "all", "minPrice": null, "maxPrice": null },
    "scrapedAt": "2026-07-06T14:14:14.711Z"
  },
  "items": [
    {
      "project": { "id": "...", "slug": "...", "name": "...", "units": [] },
      "unit": { "id": "...", "beds": 1, "launchPriceAed": 1200000 },
      "catalog": { "id": "...", "citySlug": "dubai", "locationFull": "..." }
    }
  ]
}
```

Each `items[]` entry is a `FlatUnit` — same shape as `createCatalogApi().flattenCatalogUnits()`.

---

### `GET /api/catalog/projects/:slug`

Full project detail with nested units, gallery, amenities, brochure URL.

```json
{
  "project": {
    "id": "...",
    "slug": "105-residences",
    "name": "105 Residences",
    "units": [{ "id": "...", "beds": 0, "launchPriceAed": 1275888 }],
    "amenities": ["Pool", "Gym"],
    "imageGallery": ["https://..."],
    "coordinates": { "lat": 25.04, "lng": 55.20 }
  }
}
```

404: `{ "error": "project_not_found" }`

---

### `GET /api/catalog/map`

Map pin payload — replaces `/data/catalog-map.json`.

```json
{
  "scrapedAt": "2026-07-06T14:14:14.711Z",
  "projects": [
    {
      "id": "...",
      "slug": "105-residences",
      "name": "105 Residences",
      "developer": "Kamdar Developments",
      "area": "Jumeirah Village Circle",
      "city": "dubai",
      "lat": 25.04981783928,
      "lng": 55.20901801946,
      "minPriceAed": 1275888,
      "handover": "Q2 2027",
      "imageUrl": "https://..."
    }
  ]
}
```

---

### `POST /api/projects/by-slugs` (existing)

Batch project lookup for favorites/compare. Body:

```json
{ "slugs": ["105-residences", "113-residences"] }
```

Will be extended to read from D1 when `DB` binding is available (same `{ projects: Project[] }` response).

---

## Error responses

| Status | `error` | When |
|--------|---------|------|
| 503 | `catalog_database_unavailable` | D1 `DB` binding missing |
| 503 | `catalog_database_empty` | Schema exists but not seeded |
| 404 | `project_not_found` | Unknown slug |

## Frontend integration (Antigravity)

1. Add `NEXT_PUBLIC_CATALOG_API=1` feature flag.
2. Point `catalog-browser.ts` fetches to `/api/catalog/*` instead of static JSON.
3. Keep IndexedDB cache keyed on `meta.scrapedAt` from `/api/catalog/meta`.
4. No changes required to `catalog-core.ts` filter/sort logic — API returns `FlatUnit[]`.

## Database

- **Engine:** Cloudflare D1 (SQLite)
- **ORM:** Drizzle
- **Binding:** `DB` in `wrangler.jsonc`
- **Database ID:** `e5aa2877-4359-4c28-8499-0c149200c6a4`
- **Tables:** `catalog_meta`, `city_counts`, `developer_serp_links`, `developers`, `projects`, `project_units`, `catalog_units`