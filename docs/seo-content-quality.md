# SEO content quality — enrich vs noindex policy

**Status:** living policy (soft SEO residual)  
**Grounding:** [[iop-bughunt-loop]] judgment calls, [[investoffplan-nextjs]] SEO pillars, issues #191 / Wave Q+S.

## Default: **prefer enrich** over prune/noindex

Programmatic pages earn their index slot when they carry **unique, verified catalog/DLD facts** a user cannot get from a thin shell. When enrichment is cheap and honest, **keep the URL indexable**.

| Surface | Policy | Implementation |
|---------|--------|----------------|
| **PDP with real description** | Index | Catalog `descriptionUnique` / sanitized HTML / enrichment summary |
| **PDP with no real copy** (empty fields or junk HTML like `<p><br></p>`) | **Enrich → index** | `buildFactualSummary` + `hasSubstantialProjectCopy` gate; never invent amenities/ratings |
| **PF placeholder names** (`New Project by …`, slug `new-project-by-*`) | **Soft-title + noindex,follow** | `shouldNoindexProject` / `displayProjectName` |
| **Area / project / developer compare pairs** | **Enrich → index** | Decision layer (scorecards, pros, who-suits, FAQs, related mesh); hubs at `/compare`, `/compare-projects`, `/compare-developers` |
| **Unit compare tool** (`/compare/units`) | **noindex,follow** | Share-link tool; not in sitemap; robots disallow |
| **User-state** (`/favorites`, `/account`) | **noindex,nofollow** | No public unique content; dropped from sitemap |
| **Print/gated reports** (`/reports/market/[slug]`) | **noindex** | Freemium exports, not organic landing pages |
| **404 / global-not-found** | **noindex,follow** | Soft-404 hygiene |

## Title / meta rules

- Layout template: `%s | invest off-plan` (brand once).
- Prefer **plain** `title` strings (not `absolute`) so the template applies.
- Pair titles via `comparePairTitle()` — leave room for the brand suffix so the rendered `<title>` stays **≤60 characters**.
- Meta descriptions **≤158** characters; lead with entities (names, areas, prices).
- Reciprocal **hreflang** on EN⇄AR mirrors via `enMeta()` / `arMeta()`.

## Thin PDP residual (why not mass-noindex)

~100 catalog projects have no marketing body copy (many sold-out single-unit shells). Mass-noindex would drop recoverable long-tail brand/project queries. **Factual About** keeps them honest and indexable; placeholders alone stay noindex.

## When to noindex later

Revisit prune/noindex only with evidence (Search Console impressions ≈ 0 for 90+ days **and** no internal-link value). Do not prune high-intent brand pairs (top developers/communities).

## Related code

- `src/lib/project-factual-summary.ts` — factual About + substantial-copy gate  
- `src/lib/seo-title.ts` — title clamp / pair titles  
- `src/lib/catalog-core.ts` — `shouldNoindexProject`  
- `src/app/robots.ts` — `/compare/units` + API disallow  
- `src/lib/sitemap-groups.ts` — public URL inventory  
