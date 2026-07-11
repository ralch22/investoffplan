# Developer Profile — methodology & sign-off gate

**Status:** shipped behind `feat/developer-track-record`. **Sign-off gate:** the
tier labels (`Established / Growing / Boutique`), the positioning band labels
(`Premium / Mid-market / Value`), the composite weights, and the verbatim
disclaimer wording require Rami sign-off before they are treated as final
copy. Everything below is data-derived and safe to publish; the *wording* is
what needs review.

## What this is (and is not)

The **Developer Profile** is a data-derived summary of the **size and market
positioning** of a developer's off-plan catalog. It is **NOT** a rating of:

- construction quality,
- delivery timeliness / handover reliability, or
- financial stability.

invest off-plan holds **no** data on any of those things, so we do not score
them. This is a hard project rule (verified-claims-only). The panel shows the
disclaimer verbatim:

> This profile is derived only from the size and market positioning of this
> developer's off-plan catalog and 2025 Dubai Land Department data for the
> areas they build in. It is not a rating of construction quality, delivery
> timeliness, or financial stability.

## Inputs — every number is computable from data we own

All figures come from exactly two owned/licensed sources:

1. **The developer's own off-plan catalog** (`data/catalog.json`): project
   count, project `area` strings, `paymentPlan` strings, and unit
   `launchPriceAed` / `sqftMin`.
2. **Official 2025 Dubai Land Department (DLD) open data**
   (`data/dld-area-stats.json`, anonymized aggregates only): the median
   AED/sqft for each community, resolved through the existing `areaKey()`
   crosswalk. No owner-identifying data is used or displayed.

No third-party ratings, reviews, surveys, or subjective judgements enter the
computation. Nothing is fabricated.

## The four sub-metrics (each 0–100)

Computed in `src/lib/developer-score.ts` (pure, unit-tested in
`tests/developer-score.spec.ts`).

| # | Sub-metric | Formula | Source |
|---|---|---|---|
| 1 | **Portfolio scale** | `100 · ln(1 + projectCount) / ln(1 + maxProjectCount)` | Own catalog |
| 2 | **Geographic reach** | `100 · ln(1 + communityCount) / ln(1 + maxCommunityCount)` | Own catalog (distinct communities via `communitySlugFor`) |
| 3 | **Buyer-friendly terms** | `100 · postHandoverProjects / totalProjects` | Own catalog (payment-plan strings) |
| 4 | **Market positioning** | `ratio = devMedianPpsqft / marketMedianPpsqft` → band + centred index | Own catalog prices ÷ 2025 DLD area medians |

- **Log scaling** (1 & 2) stops one mega-developer (Emaar, ~222 catalog
  projects, 16 communities) from flattening everyone else to ~0.
- `maxProjectCount` / `maxCommunityCount` are catalog-wide maxima computed once
  per build (`getDeveloperProfileNorms` in `catalog.ts`).
- **Post-handover** (3): a `paymentPlan` string qualifies when `parsePaymentPlan`
  yields a 4-segment plan whose segments total a **valid 95–105%** and whose
  post-handover (`after`) segment is **> 0**.
- **Market positioning** (4) is a **positioning** signal on a value↔premium
  spectrum, **not** a better/worse axis:
  - `ratio ≥ 1.15` → **Premium**
  - `ratio ≤ 0.85` → **Value**
  - otherwise → **Mid-market**
  - Its 0–100 index (`50 + (ratio − 1)·100`, clamped) is centred on 50 = priced
    in line with the areas they build in. It exists only to fold positioning
    into the composite; the UI shows the **band label**, not the index, to
    avoid any "premium = better" read.
  - When **no** community the developer builds in has DLD coverage, positioning
    is **dropped** — never fabricated — and the composite renormalizes over the
    remaining three sub-metrics. DLD coverage today: ~63% of catalog projects,
    131 / 213 developers with ≥1 resolvable community.

## Composite ("Profile score") & tier

`composite = weighted average of the available sub-metric scores`, weights:

| Sub-metric | Weight |
|---|---|
| Portfolio scale | **0.35** |
| Geographic reach | **0.25** |
| Buyer-friendly terms | **0.25** |
| Market positioning | **0.15** |

When market positioning is unavailable, the other three weights are
renormalized to sum to 1 (`0.35 / 0.85`, `0.25 / 0.85`, `0.25 / 0.85`).

The composite maps to a **descriptive size band** (not a ranking). The
displayed labels were revised after an adversarial honesty review (2026-07-11)
which flagged that "Established"/"Growing" imply tenure/track-record/momentum
the data cannot support (the inputs are the *undelivered* off-plan catalog, with
no delivery history or time-series). Internal enum keys are unchanged; only the
user-facing strings were made purely size-descriptive:

| Composite | Internal key | Displayed label (EN) |
|---|---|---|
| ≥ 45 | `established` | **Large portfolio** |
| 25 – 44 | `growing` | **Mid-size portfolio** |
| < 25 | `boutique` | **Boutique portfolio** |

The panel's `tierLabel` was likewise changed from "Profile score" to **"Catalog
scale"**, and the load-bearing disclaimer (construction quality / delivery
timeliness / financial stability) is now rendered ALWAYS-VISIBLE beside the
badge, not only inside the collapsed methodology panel. A larger composite
reflects a **bigger, broader, more premium-positioned catalog** — it does **not**
mean "higher quality" or a proven delivery record.

### Calibration snapshot (current catalog)

`Emaar Properties` → Established (222 projects, 16 communities); `Sobha` /
`Damac` → Established; most 1–3 project developers → Boutique (this is honest —
they *are* small). `Damac` ratio ≈ 0.61 (Value positioning), `Binghatti` ≈ 1.31
and `Ellington` ≈ 1.2 (Premium).

## Surfacing

- **`/developers/[slug]`** (EN + AR, shared server component): a server-rendered
  (indexable, ISR-safe — no cookies/headers) "Developer profile" panel with the
  four labelled bars/bands, the composite tier, and an expandable methodology
  disclosure carrying the exact inputs + verbatim disclaimer. Labels are
  localized via `dict.developers.profile.*` (EN + AR parity, `Dict`-enforced).
- **`/developers` index:** a per-card tier badge is **optional** and currently
  **not shipped** — doing it consistently means computing full profiles for all
  ~213 developers on the index, and a cheaper approximation would show a tier
  inconsistent with the detail page. Revisit only if product wants it, using
  the same `getDeveloperProfile` path.

## Change control

Any change to weights, thresholds, band cut-offs, or the tier / positioning
label wording is a **copy/product change** and goes back through Rami sign-off.
The math itself is covered by `tests/developer-score.spec.ts`.
