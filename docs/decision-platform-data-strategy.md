# Decision-Platform Evolution: Strategy + Data Integration Assessment
2026-07-08 · sources: "Platform Strategy Overview" + "Developer Brief: BeHomes API + Digital Dubai DaaS" (Google Docs, WP sections superseded by our stack) + live inspection of Property Monitor IQ (Rami's licensed seat)

## 1. Where the strategy meets reality: we're further along than the docs assume

The docs were written against a from-scratch WordPress build. Against the live Next.js platform:

| Strategy pillar | Doc target | Our live state | Net-new work |
|---|---|---|---|
| 1. Project pages | ~250, 3 months | **725 live** with floor plans, FAQs, unique-content engine running | None (exceeded) |
| 2. Comparison pages | ~600 programmatic | Unit compare tool only — **no /compare/{a}-vs-{b} SEO pages** | **THE gap — the moat** |
| 3. Guides & trust | 10–20 | 6 guides + 15 FAQ topics + 10 news, all unique | Escrow/risk trust guides (~5) |
| 4. Location guides | 80–150 | 30 area editorials + 9 collections | Scale 30→~120 + /communities hub distinction |
| Suitability logic | Family/Investor/Holiday/End-user scoring | Nothing | Rule-based engine on existing catalog + new data |
| Liquidity/yield data | DLD + BeHomes blend | **Nothing (GOAL P3 "licensed data" lane)** | Data pipelines below |
| Secure purchase layer | Dropped from scope (doc 2) | — | Out of scope ✓ |

**Conclusion: the strategic net-new = (a) the programmatic comparison engine, (b) the transactions/liquidity/yield data layer, (c) suitability scoring, (d) location-guide scale-up.** Everything else is already shipped or in the AO pipeline.

## 2. Data source evaluation (revised against what we already have)

| Source | What it gives us | Cost | Verdict |
|---|---|---|---|
| **Dubai Pulse / DLD open data** (dld_transactions, dld_buildings, dld_developers, residential_sale_index, land registry, GIS) | Sold transactions per community/project → **resale liquidity scoring, sold-history on PDPs, price-per-ft² truth**; developer delivery history; legally **republishable** open data | Free tier (CSV + rate-limited API); paid ~AED 1k–10k/mo later | **START NOW** — this alone closes the GOAL P3 lane |
| **Property Monitor IQ** (Rami's live seat — inspected) | Richest per-project data seen anywhere: DLD-verified status, **% sold**, % complete, construction/sales dates, developer legal entities, payment plans, inspections; **rental index per 121 communities + yield tab back to 2013** | Already paying | **Use two ways**: (1) analyst tool for editorial/QA now; (2) approach PM for their official **API/data licence** for programmatic yield + %-sold fields. Do NOT scrape the authenticated app for republication — licence risk; the open-data path covers republishable needs |
| **BeHomes API** | Off-plan projects/layouts/developers | Paid key | **SKIP for now** — ~90% overlap with our existing PF-scraped catalog (725 projects, floor plans, payment plans). Revisit only if PF scraping becomes fragile |
| **Firecrawl** (already integrated, `FIRECRAWL_API_KEY` live) | Gap-filling: Bayut/Dubizzle rental asking prices (yield cross-check), service charges where published, public PM market reports | Existing sub | **Phase 2** — targeted, polite, attribution-aware |
| **Our PF catalog + enrichment** | Everything off-plan | Running | Baseline |

Cost picture: **Phase 1 costs ≈ AED 0** (Dubai Pulse free tier + existing infra) vs the doc's assumed BeHomes + DLD Gateway (AED 30k/yr) spend.

## 3. The comparison engine (Pillar 2) — design for our stack

- **Route**: `/compare/{slug-a}-vs-{slug-b}` (canonical ordering: alphabetical to prevent dupes), route group `(en)` + later `(ar)`.
- **Entity types**: community-vs-community (from our areas), developer-vs-developer, project-vs-project — all three from existing catalog data; comparisons render KPI tables (price from, AED/ft², payment plans, handover distribution, unit mix, amenities overlap) computed live from D1, plus liquidity/yield rows once the DLD layer lands.
- **Pair selection** (~600 pages): same-city area pairs weighted by unit counts (top 40 areas → ~250 pairs), top-20 developer pairs (~120), flagship project pairs within same area/price band (~200), + the realtor-blog-proven head terms (Damac Hills 2 vs Emaar South etc.).
- **Content**: KPI tables computed (never stale), narrative verdict + pros/cons via the **existing rewrite engine** (`scripts/rewrite-descriptions.ts` pattern — fact-guardrailed `claude -p`), FAQ + `FAQPage`/`ItemList` JSON-LD, internal links (area↔project↔comparison↔guides — the authority-clustering the doc prescribes).
- **Suitability**: `src/lib/suitability.ts` rule-based scores (family = schools/amenities/beds-mix; investor = yield/liquidity/price-per-ft² vs community avg; holiday = waterfront/branded/furnished signals) surfaced on comparisons + PDPs + a "who is it for" block.

## 4. Phased execution

**Phase 1 (now, free):**
1. Register Dubai Pulse; ingest `dld_transactions` + `dld_buildings` CSVs → new D1 tables (`dld_transactions_agg` per community/project-month) via a `scripts/ingest-dld-*.ts` pipeline (same politeness/drift patterns as PF scrapers).
2. Liquidity score v1 (txn volume/velocity per community) + **sold-history blocks on PDPs and area pages** — closes GOAL P3 rows.
3. Comparison engine v1 with catalog-only metrics (~250 area/developer pages) + rewrite-engine verdicts. Ship, index, measure.
4. Trust guides (~5: escrow/RERA deep-dive, developer due diligence, off-plan risk) — content system already exists.

**Phase 2:** PM official data conversation (yields + %-sold programmatic); Firecrawl rental sampling for yield estimates in the interim; expand comparisons to ~600 with yield/liquidity rows; suitability engine.

**Phase 3:** location-guide scale-up 30→~120 (Dubai Municipality open data for schools/clinics + GIS commutes), `/communities` hub (master-development level, distinct from `/areas` sub-communities — PM's DLD-community mapping is the reference taxonomy).

## 5. Risks / notes
- **Licensing discipline**: republish only open-data-licensed (Dubai Pulse) or owned/derived metrics; PM data stays internal until a licence exists; attribute DLD where used. Firecrawl targets per the polite-scraping contract in the project brief.
- The IA additions (/compare, /communities, /locations) extend — not replace — current nav; hreflang/AR follow the established route-group pattern.
- SEO sequencing per doc's rollout: comparisons only after the current unique-content pass finishes (avoid launching thin pages while PDP uniqueness is still rolling out).
