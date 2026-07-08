# DLD "BIG DATA" Analysis — Google Drive folder (2026-07-08)

Source: shared Drive folder "BIG DATA" (owner mirakijka@gmail.com), Dubai Land Department / Dubai Pulse open data, full-year 2025. Analysed with DuckDB over the full monthly splits (not the 5k-capped top-level samples).

## What's in the folder
- **TRANSACTIONS/** — 12 monthly files, **267,557 real 2025 transactions** (clean 22-col schema: date, group, off-plan flag, freehold, usage, area, type, TRANS_VALUE, ACTUAL_AREA, rooms, parking, nearest metro/mall/landmark, buyer/seller counts, project, master project).
- **RENTS/** — 12 monthly files (Ejari): area, contract/annual amount, area, type, rooms → **yield modelling**.
- `projects-2025.csv` — 410 registered projects: developer, status, **ESCROW_ACCOUNT (100% present)**, completion date, land/building/villa/unit counts.
- `developers-2025.csv` — 403 licensed developers: license type/status/dates, webpage, phone.
- `mystery.csv` — **the DLD Property Price Index** (158 monthly rows ≈ 13 yrs): flat/villa/all monthly-quarterly-yearly indices.
- `buildings.csv` / `units.csv` / `transactions.csv` (top level) — **⚠️ 5,000-row SAMPLES, not full** — ignore in favour of the monthly splits.
- `areas.csv` (300 DLD areas + ids), `brokers-2025.csv` (38,932), `offices.csv` (6,162), `lands-2025.csv` (231,479 parcels).

## Headline market findings (full 2025)
- **AED 892 billion** across 267,557 transactions. Split: **Sales 77.9% · Mortgage 18.6% · Gifts 3.5%**.
- **Off-plan = 62% of residential sales** (129,610 vs 78,885 ready) — hard confirmation that IOP's off-plan focus targets the majority of the market.
- **Prices rose +13.9% through 2025**: median residential AED/sqft 1,542 (Jan) → 1,756 (Nov). (Dec is a partial-month export.)
- **Top liquidity market = Jumeirah Village Circle** (18,223 sales, 69% off-plan, median AED 1,472/sqft) — exactly where our catalog is deepest. Then Business Bay (12,880 sales, premium AED 2,446/sqft), Dubailand Residence Complex (7,746, 85% off-plan).
- **Gross yields compute live** from rent+sale medians: 3–6% across areas (e.g. Dubai Investment Park ~4.6%).

## Integration verdict (the point)
**This is the enrichment data layer the strategy doc called for — free, republishable DLD open data, and it contains the "proprietary" fields I thought would need a Property Monitor licence** (escrow, % complete, project status, developer licensing). No PM scraping needed.

Join feasibility to our 725-project catalog:
- **Projects → DLD txn stream: 303/725 (42%) matchable** (129 exact + 174 fuzzy on PROJECT_EN). → attach real **sold-history + liquidity score** to ~42% of PDPs immediately.
- **Areas: 43/94 auto-match** (23 exact + 17 fuzzy). Gap cause: DLD uses formal cadastral names (Al Yelayiss 1, Madinat Al Mataar) vs PF marketing names (Dubai South, Emaar South). **Needs a one-time ~50-row area crosswalk** (manual + fuzzy).
- Developers: weak auto-match (16/213) — our catalog dev names are PF sub-brands; DLD's 403 licensed entities are authoritative → crosswalk keyed off projects.

## Recommended use (feeds the decision-platform Phase 1)
1. Build `scripts/ingest-dld-*.ts` → new D1 tables (`dld_txn_area_month`, `dld_project_txn`, `dld_price_index`, `dld_rent_area`) from the monthly splits.
2. Derived metrics: **liquidity score** (txn volume/velocity per area+project), **real AED/sqft** (from actual sales, not launch prices), **gross yield** (Ejari rent ÷ sale median), **appreciation** (price index).
3. Surface on PDPs (sold-history + liquidity) + area pages (yield + price trend) + the future comparison engine — **closes the GOAL.md "licensed data (P3)" lane at ~AED 0**.
4. Build the area/developer crosswalk tables first (blocks everything downstream).

## Caveats / data quality
- Top-level transactions/units/buildings CSVs are 5k samples — do not use.
- Yields here compare 2025 sale medians vs 2025 rent medians per area; production should match ready-unit sales to rents (off-plan sale ≠ current rent).
- **Provenance/licensing: this folder is shared from a third party.** DLD open data is redistributable under Dubai Data Law, but confirm the specific dataset's redistribution terms before publishing derived figures — ideally re-pull from dubaipulse.gov.ae directly for a clean licensed chain.
- Dec 2025 is a partial-month export (lower counts).

---

## GROUNDING UPDATE (2026-07-08): BelowOP already built this — reuse, don't rebuild

Checked the Obsidian vault + BelowOP repo (`ralch22/belowop-demo`). BelowOP **already productionized the exact DLD anonymized-aggregate layer** this analysis was heading toward:
- `lib/dld.ts` (pure math, unit-tested, portable to Cloudflare): PII tripwire (`detectPiiColumns`), `saleStats`, gross/service-charge/net yields, `ppsqft`, confidence scoring, and — critically — **`AREA_ALIASES` + `areaKey()`, the DLD-formal→marketing-name crosswalk I flagged as "needs building"**. It already maps `DUBAI SOUTH DUBAI WORLD CENTRAL → DUBAI SOUTH` (our #1 catalog area), `AL BARSHA SOUTH FOURTH → JVC`, etc.
- `dld_area_stats` table + `lib/area-insights.ts` (cached serving) + `scripts/dld-aggregate.ts` (ETL) + coverage/verify QA scripts.

**Two hard lessons from BelowOP (adopt):**
1. The **developer prefix-join is unsafe** — `dld_developers` (403 rows) holds only sub-entities, not brands; it attaches the wrong legal entity. BelowOP leaves developer trust sections absent. (My own test independently confirmed: 16/213 dev match.)
2. **PII governance**: some DLD exports are owner-identity-enriched. Never ingest/display counterparty PII in the public app — drop it at ingest.

**Rami has full purchase-level DLD in BigQuery** (richer than this CSV folder, which had 5k-capped top-level samples). That is the PII-enriched source the guard exists for.

### Revised recommendation (supersedes "build a pipeline from scratch")
1. **Port `lib/dld.ts` from BelowOP to IOP** (pure functions; reuse PII guard + saleStats + yields + AREA_ALIASES + mappers).
2. **Adopt the `dld_area_stats` schema** in IOP's D1.
3. **Source from BigQuery, not the CSV folder** — write anonymized-AGGREGATE SQL (median price, AED/sqft, volume, gross/net yield, appreciation, per area/project/beds), PII columns never selected. BigQuery MCP needs auth (Rami runs it or grants access; I'll author the SQL).
4. **Skip the developer join** (unsafe); keep sold-history + liquidity + yield on PDPs/area pages + the comparison engine.
5. Provenance: confirm redistribution terms; DLD open data is republishable but re-pull from a clean licensed chain (BigQuery-of-record) before publishing derived figures.

---

## PROTOTYPE RUN on full local dataset + BigQuery source (2026-07-08)

Full data confirmed: **267,687 transactions + 1,048,619 Ejari rent contracts (2025)**. Also loaded into **BigQuery `uae-data-478407.google_drive`** (the source-of-record for the ETL once the connector is authorized).

Ran BelowOP's method (areaKey crosswalk + saleStats + grossYield + confidence) over the full set → produced the real `dld_area_stats` for our catalog. Sample (high-confidence areas):

| area | sales | median price | AED/sqft | median rent | gross yield |
|---|---|---|---|---|---|
| Jumeirah Village Circle | 18,223 | 1,018,000 | 1,472 | 70,000 | **6.9%** |
| Business Bay | 13,504 | 1,658,185 | 2,449 | 100,000 | **6.0%** |
| Dubai Marina | 5,236 | 2,400,000 | 2,637 | 123,670 | **5.2%** |
| Downtown Dubai | 3,941 | 3,100,000 | 2,987 | 185,000 | **6.0%** |
| Bukadra | 3,632 | 2,119,482 | 2,470 | 92,950 | **4.4%** |

**Coverage of our 94 catalog areas** (with a minimal 6-entry crosswalk): **28 areas get high-confidence sale stats, 8 get yields.** The matched 28 are the high-volume markets (JVC 18k, Business Bay 13k, Marina, Downtown) = the bulk of catalog value. Expanding the crosswalk to BelowOP's full `AREA_ALIASES` (~25 entries) + adding project-level joins lifts coverage materially. Rent-side coverage is thinner than sales (Ejari records some sub-communities under parents) — matches BelowOP's observation; net yields need `Oa_Service_Charges` (not in this export).

**Bottom line: the enrichment lane is proven on real data and free.** Next = port `lib/dld.ts`, adopt `dld_area_stats` in D1, and run the ETL from BigQuery `uae-data-478407.google_drive` (anonymized aggregates only).
