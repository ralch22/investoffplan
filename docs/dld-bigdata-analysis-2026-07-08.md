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
