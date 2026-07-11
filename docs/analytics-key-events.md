# Analytics event catalog & GA4 key events

All custom events go through `trackEvent()` in `src/lib/analytics.ts`, which no-ops
unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set at build time. Event names live in the
`ANALYTICS_EVENTS` constant — never call `gtag`/`dataLayer` directly.

## Event catalog (16 events)

| Event name | Params | Where fired | GA4 key event |
|---|---|---|---|
| `brochure_open` | `project_name`, `delivery` (`pdf`\|`whatsapp`) | `src/components/brochure-modal.tsx` — after successful lead submit | — |
| `brochure_request` | `method`, `project` | `src/components/brochure-modal.tsx` — WhatsApp fallback path | ✅ **Mark as key event** |
| `brochure_whatsapp_fallback` | `project_name` | `src/components/brochure-modal.tsx` — WhatsApp fallback path | — |
| `contact_submit` | `form` (`contact_page`\|`contact_cta`\|`mortgage_preapproval`) | `src/components/contact-form.tsx`, `contact-cta-form.tsx`, `mortgage-preapproval-form.tsx` | ✅ **Mark as key event** |
| `compare_add` | `unit_id` | `src/app/(en)/projects/projects-page.tsx` — SERP compare toggle | — |
| `compare_view` | `item_count` | `src/app/(en)/compare/units/compare-page.tsx` — once per visit when 2+ units render | — |
| `whatsapp_click` | varies (`source`, `project_name`, …) | `contact-button.tsx`, `developer-contact-panel.tsx`, `project-detail-ctas.tsx`, `project-summary-rail.tsx` | — |
| `search_submit` | `query_length`, `source` (`hero`\|`header`\|`sheet`\|`drawer`) | `hero-search.tsx`, `nav/header-search.tsx`, `nav/mobile-search-sheet.tsx`, `mobile-nav.tsx` | — |
| `search_suggest_click` | `suggestion`, `position` (planned) | Reserved — wire into search suggestions when built | — |
| `quiz_complete` | `result`, `steps` (planned) | Reserved — investor-profile quiz | ✅ **Mark as key event** (once wired) |
| `roi_calc` | `price`, `yield` (planned) | Reserved — PDP ROI calculator interaction | — |
| `roi_calculate` | `price`, `yield`, `years`, `community` | `src/components/roi-estimator.tsx` — fired (debounced ~500ms) once inputs settle on `/tools/roi` | — |
| `alert_subscribe` | `channel`, `topic` (planned) | Reserved — price/launch alert opt-in | ✅ **Mark as key event** (once wired) |
| `pdp_section_view` | `section_id` | `src/components/section-view-tracker.tsx`, mounted on the PDP (`src/app/(en)/projects/[slug]/page.tsx`) — once per section per page view at 40% visibility | — |
| `sign_in` | `method` (planned) | Reserved — account sign-in | — |
| `gate_prompt` | `context` (`compare-slot`\|`pdf-export`\|`save-search`\|`deep-analytics`) | `src/components/auth/gate.tsx` — fired when a signed-out user hits a freemium-gated interaction and the sign-in modal opens | — |

## GA4 key events to mark

In GA4 → **Admin → Events**, toggle "Mark as key event" for:

1. `contact_submit`
2. `brochure_request`
3. `alert_subscribe`
4. `quiz_complete`

(Key-event toggles only appear after GA4 has received at least one instance of the event.)

## Linking Google Search Console to GA4 (5 steps)

1. In GA4, go to **Admin → Product links → Search Console links** and click **Link**.
2. Choose the verified Search Console property for the production domain (must be
   verified under an account that is also a GA4 property editor).
3. Select the GA4 **web data stream** for the same domain and confirm the link.
4. In GA4 **Reports → Library**, publish the "Search Console" collection so the
   *Queries* and *Google organic search traffic* reports appear in the left nav.
5. Allow ~48 hours for data to flow, then verify the Queries report shows
   impressions/clicks matching Search Console.

## Microsoft Clarity setup

Clarity (session recordings + heatmaps) loads via `src/components/clarity.tsx`,
mounted in both layouts (`src/app/(en)/layout.tsx`, `src/app/(ar)/ar/layout.tsx`).
It is env-gated: with no `NEXT_PUBLIC_CLARITY_ID` it renders nothing, so ISR output
is unaffected.

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com) and copy
   the project ID (the short token in the snippet, e.g. `abcd1234ef`).
2. Set `NEXT_PUBLIC_CLARITY_ID=<project-id>` in `.env.production` (and in the CI/deploy
   environment) — it is a build-time public var, so a rebuild/redeploy is required.
3. Optional: in Clarity project settings, enable the GA4 integration so recordings are
   linked to GA sessions.
