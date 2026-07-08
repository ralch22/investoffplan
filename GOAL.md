# invest off-plan — regional portal goal

**North star:** Exceed [Property Finder new-projects](https://www.propertyfinder.ae/en/new-projects?view=unit_types) on content depth, buyer tools, usability, and accessibility — while matching or beating catalog coverage (unit-level SERP + full PDP).

**Counterparty benchmarks:**
- Property Finder `view=unit_types` SERP + single project PDP (e.g. Address Residences Zabeel)
- [Property Finder DataGuru](https://www.propertyfinder.ae/blog/data-guru/) five-tool toolkit (Price Map, Community Insights, Rent vs Buy, Residential Insights, New Projects)
- [opr.ae](https://opr.ae/) (added 2026-07-08): editorial area pages, FAQ hub, real blog/news, mortgage calc + pre-approval lead engine, collection SEO URLs, Arabic locale

**Preview:** https://investoffplan-preview.emerge-digital.workers.dev  
**Production:** https://investoffplan.com (cutover pending)

---

## KPI targets (parity → exceed)

| KPI | PF baseline | IOP target | Status |
|-----|-------------|------------|--------|
| Unit-level SERP | ~1,530 units | ≥1,500 units + compare + brochures | **Met** (1,501) |
| Brochure on listing | Partial | 100% path (PDF or WhatsApp) | **Met** (436 PDF + fallback) |
| PDP key facts block | Delivery, location, payment, types, fee, ownership | 1:1 fields + handover sort | **Met** |
| PDP rich about | Full HTML + amenities + masterplan | Sanitized HTML + amenities; masterplan scrape | **Met** (HTML); masterplan P2 |
| PDP location | Map + area context | Map embed + area page link | **Met** |
| PDP timeline | 4-milestone timeline | Handover + status timeline | **Met** |
| PDP payment tools | Payment plan picker | Calculator + plan label | **Exceed** |
| Compare units | None | Up to 3 side-by-side | **Exceed** |
| Price/sqft | None | On SERP + PDP | **Exceed** |
| Accessibility | Unknown | WCAG 2.2 AA on SERP + PDP | **In progress** |
| Core Web Vitals | Industry leader | LCP <2.5s, CLS <0.1 | **Monitor** |
| Production domain | Live | `investoffplan.com` live | **Blocked** (DNS/Worker) |

---

## Parity matrix (site-wide)

### SERP (`/projects`, unit view)

| Feature | PF | IOP | Priority |
|---------|----|-----|----------|
| Headline unit count | "1530 Total units options in UAE" | Match copy + live count | P0 |
| Unit view default | `view=unit_types` | `viewMode=unit` default | **Done** |
| Card: unit count badge | "11 apartment Units" | `projectUnitCount` + type | P0 |
| Card: launch price range | "704K - 1.3M AED" | `formatFromPrice` | **Done** |
| Card: premium badge | Yes | `isPremium` | **Done** |
| Card: developer + location | City, area, beds, sqft | Match hierarchy | P0 |
| Filters: city, beds, type, price | Yes | Yes + collections | **Exceed** |
| Grid / list / map | Grid | Grid + list + map | **Exceed** |
| Sort | Limited | price, value, handover | **Exceed** |
| Compare | No | Yes | **Exceed** |
| Brochure CTA on card | No | Yes | **Exceed** |

### PDP (`/projects/[slug]`)

| Feature | PF | IOP | Priority |
|---------|----|-----|----------|
| Launch price hero | Yes | Yes | **Done** |
| Key information grid | 8 fields | `ProjectKeyFacts` | P0 |
| Payment plan section | Multi-plan picker | Label + calculator | P1 |
| Project timeline | 4 milestones | `ProjectTimeline` | P0 |
| About (rich HTML) | Long form | Sanitized catalog HTML | P0 |
| Unit types table | By bed band + sqft ranges | Per-unit rows | P1 (enhance ranges) |
| Amenities | Icon list | Pills → icon grid | P1 |
| Masterplan image | Yes | `masterPlanUrl` via PF scrape | **Met** (see catalog) |
| Location map | Yes | Embed + Google Maps | P0 |
| Living in [area] | Community scores | Link to `/areas/[slug]` | P1 |
| Sold history | Yes | Requires PF resale API | P3 |
| Resale count | Yes | Requires resale data | P3 |
| Sticky section nav | Implicit | `ProjectDetailNav` | **Done** |
| Mobile CTA bar | Agent-led | Brochure + WhatsApp | **Exceed** |

### Exceed lanes (IOP-only)

- Compare up to 3 units with brochure status
- Payment plan calculator on PDP
- Favorites without 8MB catalog download
- D1 catalog API + weekly ingest
- Turnstile on all lead forms
- Guides / insights content hub

### Developer LP (`/developers/[slug]`)

| Feature | PF | IOP | Priority |
|---------|----|-----|----------|
| Developer hero + logo + bio | Yes | Logo + catalog bio excerpt | **Done** |
| Contact developer (Email, WhatsApp) | Yes | `DeveloperContactPanel` | **Done** |
| H1: New & Off-Plan Projects by [Dev] | Yes | Match copy | **Done** |
| Project count + sort (Featured) | Yes | Catalog count + `SortSelect` | **Done** |
| Project card grid (beds, type, price, plan, WA) | Yes | `DeveloperProjectCard` | **Done** |
| Pagination | Yes | `DEVELOPER_PAGE_SIZE` (12) | **Done** |
| SEO about + FAQ block | Yes | Sanitized HTML + FAQ details | **Done** |
| Full developer portfolio count | 222 (Emaar) | 222 via `scrape:dev-portfolio` | **Done** (Emaar) |

### DataGuru parity (`/tools`)

| PF DataGuru tool | PF URL | IOP route | Status |
|------------------|--------|-----------|--------|
| Price Map | `/en/area-insights/explore-prices/dubai` | `/tools/price-map` | **Done** (launch-price heatmap; PF uses rental) |
| Community Insights | `/en/area-insights/dubai` | `/tools/communities` | **Done** (lifestyle clusters + area cards) |
| Rent vs Buy Calculator | `/en/rent-vs-buy-calculator` | `/tools/rent-vs-buy` | **Done** |
| Residential Insights | `/en/area-insights/dubai/compounds-and-towers` | `/tools/residential` | **Done** (launch benchmarks; PF has resale trends) |
| New Projects | `/en/new-projects` | `/projects` | **Exceed** (unit SERP + compare + brochures) |
| Toolkit hub | Blog landing | `/tools` | **Done** |

**Residual gaps (need licensed data):** PF rental heatmap values, tower resale/rent history, sold transactions on PDP.

---

## Execution phases

### Phase 1 — Parity shell (this sprint)
- [x] Homepage UX polish
- [x] SERP PF copy + card unit badges
- [x] PDP key facts + timeline + location + rich about
- [x] A11y: landmarks, focus, aria on new blocks (initial pass)

### Phase 2 — Content depth
- [x] Scrape masterplan URLs from PF (`npm run scrape:masterplans`)
- [x] Unit type size-range summaries on PDP
- [x] Area/community modules on PDP (`ProjectLivingInArea`)
- [ ] Enrichment pass for top 100 premium projects

### Phase 2.5 — opr.ae parity (2026-07-08 build)
- [x] Unit-size normalization (PF ships mixed sqm/sqft — normalized at ingest)
- [x] Real lead capture: /api/leads → D1 store-first → GoHighLevel (+retry cron)
- [x] SERP advanced filters (developer / payment plan / handover / amenities)
- [x] Real /news articles + canonical /guides (/insights 308s) + /faq hub (15 topics)
- [x] Mortgage calculator + pre-approval lead form (/tools/mortgage)
- [x] Area editorial depth (top 30 areas) + stats bands
- [x] Collection landing pages (/collections/* — 9 SEO URLs)
- [x] Floor plans (6,084 images, 598 projects) + PF FAQs/sales dates/ownership on PDP
- [x] Arabic /ar (RTL, dictionaries, localized chrome, home/about/contact + hreflang)
- [ ] Arabic SERP/PDP chrome + batch description_ar translation
- [x] GHL secrets + end-to-end verified (2026-07-08); notify workflow = manual step (docs/ghl-notify-workflow.md)
- [x] WhatsApp lead routing to Jad's numbers (site + catalog + ingest)
- [x] A11y quick wins from docs/a11y-audit-2026-07-08.md (labels, contrast, landmarks, Escape/roles)
- [ ] A11y structural: port brochure modal / mobile nav / filter sheet to <dialog>.showModal() (focus trap); hero-overlay contrast guarantee; sanitizer empty-heading strip

### Phase 3 — Exceed + production
- [ ] Production cutover + GA4 measurement ID
- [ ] Sold-history / resale (if licensable)
- [ ] Lighthouse 90+ mobile on SERP + PDP

---

## Guardrails

- **Max 4 concurrent AO workers** (Grok rate limits).
- **jpools deprioritized** while IOP is priority.
- **Antigravity lane:** `tests/**`, `compare-bar`, `mobile-filter-sheet`, `project-about` styling — coordinate on PDP.
- **Verify before merge:** `npm run build && npm run test:e2e`
- **Deploy preview after material UI changes.**
- **One terminal for long jobs:** never run concurrent `npm run deploy`, `npm run build`, or `assets:migrate:*` (`.next` races + manifest lock).
- **Images / CDN:** catalog URLs are `/cdn/*` → `investoffplan-preview-assets` R2. Preview Worker serves them (20/20 spot-check OK). Local `next dev` proxies missing assets to preview (`src/app/cdn/[...path]/route.ts`). Do not run two `assets:migrate:remote` sessions — manifest uses `data/.asset-migration.lock`.

---

## /goal command (IOP)

1. Read this `GOAL.md`.
2. Audit live preview vs PF URLs (SERP + 2 PDPs).
3. Report parity table with ✅ / 🟡 / ❌ per row.
4. Recommend **one** highest-leverage next play; execute on approval.
5. When all P0 rows are ✅ and production is live: propose archiving this goal doc.

**Last audited:** 2026-07-08