# Adversarial live-site audit — investoffplan.com

**Issue:** [#198](https://github.com/ralch22/investoffplan/issues/198)  
**Date:** 2026-07-12  
**Scope:** Read-only crawl of key EN+AR templates on **production** (`https://investoffplan.com`) — status codes, locale, meta domain, empty/poison patterns, sample images.  
**Vault context:** [[iop-bughunt-loop]], [[investoffplan-nextjs]], waves A–S already shipped.

## Method

- Sitemap index + 6 children: **6,709** unique `loc` URLs (EN+AR mirrors, video thumbs under `/cdn/`).
- Scripted audit of **~90** hub/detail/legacy paths (status, `html[lang]`, canonical/og/hreflang, poison heuristics).
- Manual re-probes of failures (CF headers, body snippets, slug corrections).
- Image HEAD sample (30 hero/CDN/PF URLs from home + 2 PDPs): **0 broken**.
- APIs: `/api/health`, `/api/catalog/lite`, `/api/catalog/map`, `/robots.txt`, `/sitemap.xml` → **all 200**.

### False positives (do not re-file)

| Heuristic | Why noise |
|-----------|-----------|
| Literal `undefined` in HTML | React Flight / RSC payload (`$undefined`) |
| `example.com` on `/ar/*` | Dict email placeholder `you@example.com` (auth copy) |
| `empty_main` | SSR shell; body in RSC stream, not classic `<main>` text |
| Soft-404 for `zzzz-*` | Correct **404** (gates working for projects) |
| `/communities/jvc` | Canonical slug is `jumeirah-village-circle` (not a bug) |
| Guessed guide/location slugs | Real slugs e.g. `/guides/why-invest-off-plan-dubai`, `/locations/best-communities-for-families` → 200 |

## Confirmed findings

### P1 — fixed in this PR

| ID | Finding | Evidence | Fix |
|----|---------|----------|-----|
| **A** | **`/compare` + `/ar/compare` hard-down** | Repeated `HTTP 503` body `error code: 1102` (Worker resource limit). `/compare/units` and `/compare/{pair}` stayed 200. `/market-data` 308→`/compare` cascaded the outage. | Hub no longer uses `searchParams` (was forced dynamic). `revalidate=3600`. Slim loaders `getHubProjectPairs` / `getHubDeveloperPairs` (no second full-catalog name pass). Legacy `?units=` → client redirect. |
| **B** | **Visible `AED 0` on PDP “Living in…” + tools** | `/projects/arthouse-residences`: `<dt>From</dt><dd>AED 0</dd>`. `/tools/communities`: dozens of `from AED 0`. Root: area/developer minPrice used `Math.min(...all unit prices)` including unstated **0**. | Exclude `launchPriceAed <= 0` in `getAreas` / `getDevelopers` / community rollup; guard display in `project-living-in-area` + community insights explorer; area-insights averages positive prices only. |

### P2 — filed as follow-ups

| ID | Finding | Evidence | Notes |
|----|---------|----------|-------|
| **C** | Short community aliases not redirected | `/areas` → 308 `/communities` ✓; `/areas/jumeirah-village-circle` → 308 ✓; **`/areas/jvc` → 404** | Fixed in #204: `COMMUNITY_NICKNAME_ALIASES` → 308 EN+AR (`/areas` + `/communities`). |
| **D** | No hub index for project/developer compare | `/compare-projects` and `/compare-developers` → **404** (pair URLs 200) | Hub content lives on `/compare` only; bare paths 404 for users who strip the pair. |
| **E** | Developer PDP payload size | `/developers/emaar-properties` ≈ **3.5 MB** HTML | Likely full project grid SSR; cold TTFB risk (related to prior developer-cache work, residual). |

### P3 — observe only

| ID | Finding |
|----|---------|
| **F** | Several titles >70 chars (`/market-report`, some AR tools/PDPs, compare-developers pairs). |
| **G** | 404 pages for non-project templates still render Next `__next_error__` shell (no locale layout) — known OpenNext constraint; content/meta OK, `lang` assertion not reliable. |
| **H** | AR compare hub pair links use absolute `/compare/...` (EN path) — overlaps open [[#185]] i18n leak sweep. |

## Template matrix (spot-check)

| Template | EN | AR | Notes |
|----------|----|----|-------|
| Home | 200 | 200 | OK |
| SERP `/projects` | 200 | 200 | OK |
| PDP sample | 200 | 200 | Twin slugs OK after #202 |
| Unknown PDP slug | 404 | 404 | Hard 404 ✓ |
| Communities hub | 200 | 200 | OK |
| Community detail | 200 | 200 | Use canonical slugs |
| Developers hub / detail | 200 | 200 | Emaar detail heavy |
| Compare hub | **was 503** | **was 503** | Fixed this PR |
| Compare pair | 200 | 200 | OK |
| Compare units | 200 | — | OK |
| Tools (mortgage/roi/…) | 200 | 200 | OK |
| Guides / locations / FAQ | 200 | 200 | Real slugs only |
| Market report | 200 | 200 | Long title P3 |
| Legacy `/areas` | 308 | — | OK |
| Legacy `/market-data` | 308→compare | — | Depended on compare hub |
| Legacy `/insights` | 200/308 | — | Guides path OK |
| `/api/health` + catalog lite/map | 200 | — | OK |

## Issues filed from this audit

| Finding | Issue |
|---------|-------|
| C short community nicknames (`/areas/jvc` etc.) | #204 |
| D bare `/compare-projects` + `/compare-developers` hubs | #205 |
| E developer PDP HTML payload (~3.5MB Emaar) | #206 |

P1 A/B fixed in the PR that closes #198.

## Quick wins shipped (this PR)

1. **Compare hub Worker 503** — ISR + slim hub pair helpers + legacy units client redirect.  
2. **AED 0 residual** — positive-price mins at catalog area/developer aggregation + display guards.

## Deploy note

Fixes need **production** deploy to clear live 503 / AED 0. Verify on `https://investoffplan.com/compare` (not preview worker). See ship skill.

## References

- [[iop-bughunt-loop]] residual judgment calls still open (#185–#191, #60).  
- Prior audit waves: `docs/a11y-audit-2026-07-08.md`, `docs/design-audit-2026-07-08.md`.  
- CF 1102 = Worker resource limit (CPU) on dynamic full-catalog hub.
