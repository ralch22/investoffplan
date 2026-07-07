# Agent coordination — investoffplan

Two agents work this repo in parallel. Read this before editing to avoid conflicts.

## Antigravity (Gemini IDE) — current focus

**Completed (do not revert without reason):**
- E2E stability: `CompareBar` `data-hydrated`, `tests/helpers.ts` waits for hydration
- Brochure scrape resume (436/525 PDFs; 89 use WhatsApp fallback)
- `MobileFilterSheet` brand tokens
- Playwright: `tests/fixtures.ts`, `workers: 1`
- PDP Figma polish: mixed-italic title, 2×2 mobile stats, gallery thumb ring, about/CTA pills

**Owns / prefer Antigravity for:**
- `tests/**`, `playwright.config.ts`
- `src/components/compare-bar.tsx`, `src/components/mobile-filter-sheet.tsx`
- `src/components/project-about.tsx`, `src/components/project-detail-ctas.tsx`
- `src/app/projects/[slug]/page.tsx` layout/styling (title, stats grid)
- `scripts/scrape-pf-brochures.ts`, brochure data in `data/catalog.json`
- Responsive/mobile visual QA vs Figma

**Avoid (Grok lane):** `favorites-page.tsx`, `sync-catalog-public.mjs`, `/api/projects/by-slugs`

**Brain artifacts:** `~/.gemini/antigravity-ide/brain/e596f5f3-cb2a-4e00-8b83-ef5c1721e176/`

## Grok (Cursor) — current focus

**Completed:**
- **Track B Phase 3:** R2 asset buckets (`investoffplan-preview-assets`, `investoffplan-assets`), `/cdn/*` route, migration scripts (`migrate-assets-to-r2.ts`, `apply-asset-urls-to-d1.ts`); prod R2 wiring (config support + `assets:migrate:production` / `assets:apply-d1:production`), D1 apply for prod cutover of /cdn/* asset URLs.
- **Track B Phase 2:** Upsert logic (`catalog-upsert.ts`), ingest pipeline, GitHub Actions weekly scrape (`.github/workflows/catalog-ingest.yml`)
- **Track B Phase 1 (live on preview):** D1 + Drizzle, Read API, remote seed, `NEXT_PUBLIC_CATALOG_API=1`, client/server dynamic catalog wiring, preview deploy
- **Track B Phase 1:** Cloudflare D1 + Drizzle schema, migration, seed script, Read API (`/api/catalog/*`), `docs/catalog-api.md`
- Turnstile + honeypot on all forms; `/api/turnstile/verify`, `/api/health`
- SSR compare units (`compare/page.tsx`), map deep-link + server map pins
- Favorites slim API (`/api/projects/by-slugs`) — no 8MB catalog download
- `catalog-map.json` + `catalog-lite.json` slices; lite-first client load (~0.87MB vs 8MB; issue #14 trim)
- projects inline map SSR pins
- Compare `localStorage` init fix; insights brochure CTA; production `wrangler.production.jsonc`
- LCP: hero `priority`, removed `unoptimized` on key PF images; gallery `sizes`; sitemap `scrapedAt`
- PDP `RealEstateListing` JSON-LD (`project-json-ld.ts`); deploy env verify scripts
- `catalog-lite.json` preload in `CatalogPrefetch`

**Owns / prefer Grok for:**
- `src/lib/db/**`, `src/lib/assets/**`, `drizzle/**`, `docs/catalog-api.md`, `scripts/migrate-catalog-to-d1.ts`, `scripts/upsert-catalog-to-d1.ts`, `scripts/migrate-assets-to-r2.ts`, `scripts/apply-asset-urls-to-d1.ts`, `scripts/catalog-ingest-pipeline.ts`, `.github/workflows/catalog-ingest.yml`, `src/app/cdn/**`
- `src/app/api/catalog/**`, D1 seed/migrate npm scripts
- `src/lib/turnstile.ts`, `src/lib/form-guard.ts`, form components
- `wrangler.jsonc`, `wrangler.production.jsonc`, deploy
- SSR data wiring (`catalog-data.ts` server paths)
- Performance (LCP, catalog loading architecture)
- SEO (`sitemap.ts`, metadata, JSON-LD)

## Shared — coordinate before large edits

- `src/app/projects/projects-page.tsx`
- `src/lib/catalog-browser.ts`, `src/lib/catalog-core.ts`
- `src/components/project-map.tsx`, `src/app/map/page.tsx`
- `package.json` scripts

## Deploy

```bash
CLOUDFLARE_ACCOUNT_ID=4a75e91d6fca8bc58467fb80ce1b9c2e npm run deploy
```

Preview: https://investoffplan-preview.emerge-digital.workers.dev

## Verify before deploy

```bash
npm run build && npm run test:e2e
```

## PR checks (branch protection)

PRs to `main` must pass the GitHub Actions job **`build and e2e`** (workflow: `.github/workflows/ci.yml`). Configure that check name in branch protection so AO workers cannot merge without a green build + Playwright e2e run.