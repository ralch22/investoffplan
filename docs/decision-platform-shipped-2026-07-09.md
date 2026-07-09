# InvestOffPlan — Decision Platform (shipped 2026-07-08→09)

Consolidated reference for the DLD-powered decision platform layered on top of the PF/OPR-parity catalog. Everything below is **live on investoffplan.com** and verified in the production smoke sweep (all routes 200; sitemap 1,809 URLs).

## The data layer (free, legal, anonymized)
- **Source:** Dubai Land Department open data, full-year 2025 (267,687 transactions + 1,048,619 Ejari rent contracts) — the "BIG DATA" CSV set. **NOT** the `uae-data-478407.google_drive` BigQuery dataset (that is owner-PII / breach-grade contact data — never ingested; see `dld-data-layer-belowop-reuse` memory).
- **Pipeline:** `src/lib/dld.ts` (BelowOP's pure math ported verbatim — PII tripwire, `saleStats`, yields, `AREA_ALIASES` crosswalk, `areaKey`) → `scripts/build-dld-area-stats.ts` (offline ETL, `npm run build:dld-area-stats "<BIG DATA dir>"`) → `data/dld-area-stats.json` (132 anonymized area rows, incl. per-bedroom breakdown) → `src/lib/dld-area-stats.ts` reader.
- **Governance (hard invariants):** anonymized **aggregates only** — no purchase-level/owner data, no developer-name join (both known-unsafe). Renders only where an area maps to a DLD community with ≥8 sales (graceful absence otherwise).
- **Coverage:** ~63% of catalog projects (459/725); join keys through `areaKey(firstSegment(area))` so marketing↔cadastral names bridge (e.g. JVC txn ↔ "Al Barsha South Fourth" rent → 6.9% gross yield).

## What it powers (all live)
| Surface | Route | Shows |
|---|---|---|
| Area market band | `/areas/[slug]` | median sold price, AED/sqft, 2025 volume, gross yield, monthly trend sparkline, **per-bedroom** table |
| PDP market band | `/projects/[slug]` | same, for the project's community + Golden-Visa flag + compare links |
| Area comparison | `/compare/[a]-vs-[b]` | **91 pages** — yield/price/sqft/trend/projects side-by-side + auto verdict + advisor CTA |
| Project comparison | `/compare-projects/[a]-vs-[b]` | **66 pages** — from-price/AED-sqft/beds/handover/plan/area-yield/Golden-Visa, grouped by community |
| Market-data hub | `/market-data` | top yields + area comparison grid; **"Market data" top-nav** (EN+AR) |
| Homepage | `/` | "Where the yields are" strip |
| Conversion | comparison + covered-area pages | pre-filled WhatsApp advisor CTA ("comparing X vs Y…") |

## Route namespace (three distinct compare features — don't collide)
- `/compare` + `?units=` → **unit** compare (pre-existing, up to 3 units)
- `/compare/[pair]` → **area** compare (DLD)
- `/compare-projects/[pair]` → **project** compare (DLD)

## Refresh runbook
1. Drop a fresh DLD "BIG DATA" export (TRANSACTIONS/ + RENTS/ monthly CSVs) somewhere local.
2. `npm run build:dld-area-stats "/path/to/BIG DATA"` → regenerates `data/dld-area-stats.json`.
3. Commit + deploy (`npm run deploy:production`). Coverage lift = add `AREA_ALIASES` entries in `src/lib/dld.ts` for unmatched high-volume communities (ambiguous masters left out on purpose).

## Design + quality (same window)
Design-audit top-10 all shipped (payment ribbon, red-italic hero, card motion, PDP sticky rail, dark featured bento, count-up stats, footer/newsletter imagery, priced property-type tiles, photo Key Locations, dark SERP skeleton, image highlights, AR hero search, mortgage number-morph). Unique AI-written PDP descriptions (zero PF phrasing). 75/75 e2e. See `design-audit-2026-07-08.md`, `dld-bigdata-analysis-2026-07-08.md`.

## Still open (owner-side)
- **PR #94** (GitHub Actions gated deploy-on-main) — needs the `CLOUDFLARE_API_TOKEN` repo secret + Workers Builds disconnected. Until then, deploys ride the local build+e2e gate.
- Tower-level (vs community) DLD granularity; more `AREA_ALIASES` for >63% coverage.
