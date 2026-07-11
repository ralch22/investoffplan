# Saved searches + weekly new-launch alerts

Signed-in users save a SERP filter set; a weekly dispatch emails ONE digest per
user listing newly launched projects (first seen by the ingest in the last 7
days) that match any of their saved searches.

## Flow

```
User (signed in)                     Weekly (GitHub Actions)
──────────────────                   ───────────────────────────────
SERP "Save search"                   catalog-ingest.yml
  │ POST /api/me/saved-searches        │ scrape → upsert D1
  ▼                                    │ (INSERT stamps projects.first_seen_at;
saved_searches row                     │  UPDATE never touches it)
  (filters JSON, unsubscribe_token,    ▼
   alert_enabled=1, weekly)          final step: POST /api/alerts/dispatch
                                       │ x-alerts-token (timing-safe)
                                       ▼
                                     load projects first_seen_at > now-7d
                                     load searches alert_enabled=1 AND
                                       (last_alert_at IS NULL OR < now-6d)
                                       │ per user: match (lib/alerts/match.ts)
                                       ▼
                                     ONE digest email via Resend (kind "alert",
                                     List-Unsubscribe one-click header)
                                       │ stamp last_alert_at on EVERY evaluated
                                       │ search (matched or not) — idempotency
                                       ▼
                                     25s time budget → {processed, remaining};
                                     workflow loops until remaining = 0

Email footer link → GET /api/alerts/unsubscribe?id=..&token=..
  constant-time token compare → alert_enabled=0 → HTML confirmation (no login)
```

## Pieces

| Piece | Path |
|---|---|
| Migration (table + `projects.first_seen_at`) | `drizzle/migrations/0010_saved_searches.sql` |
| CRUD API (session-guarded) | `src/app/api/me/saved-searches/route.ts` |
| Pure matcher + filter (de)serialization | `src/lib/alerts/match.ts` |
| Dispatch endpoint (token-guarded) | `src/app/api/alerts/dispatch/route.ts` |
| Unsubscribe endpoint (token-guarded, no login) | `src/app/api/alerts/unsubscribe/route.ts` |
| Digest template (EN + AR RTL) | `src/lib/email/templates.ts` (`alertDigestEmail`) |
| SERP UI | `src/components/save-search-button.tsx` (wired into `project-filters.tsx` + `mobile-filter-sheet.tsx`) |
| Account UI | `src/components/account-saved-searches.tsx` |
| Workflows | `.github/workflows/catalog-ingest.yml` (final step) + `.github/workflows/alerts-dispatch.yml` (manual) |
| Matcher spec | `tests/alerts-match.spec.ts` |

## Token setup (one-time)

```sh
# 1. Generate a token
openssl rand -hex 32

# 2. Set it as a worker secret (preview + production as applicable)
npx wrangler secret put ALERTS_DISPATCH_TOKEN
npx wrangler secret put ALERTS_DISPATCH_TOKEN -c wrangler.production.jsonc

# 3. Set the SAME value as a GitHub repository secret
gh secret set ALERTS_DISPATCH_TOKEN
```

Apply the migration before first dispatch:

```sh
npx wrangler d1 migrations apply investoffplan-catalog --remote
```

## Matcher semantics (`projectMatchesFilters`)

Saved filters are the SERP URL param vocabulary (`q, city, beds, type, minP,
maxP, dev, pay, handover, amen`), sanitized on write. Matching mirrors
`filterUnits` (catalog-core) lifted to project level:

- **Project-scoped:** `city` (city slug equality), `dev` (slugified developer
  equality), `q` (case-insensitive substring over name + developer + area).
- **Unit-scoped (ANY unit satisfies ALL together):** `beds` (`studio` = 0,
  `5` = 5+), `type` (equality), `minP`/`maxP` against `launchPriceAed`.
- `pay`/`handover`/`amen` are stored but deliberately ignored by the alert
  matcher — alerts degrade broader, never silently narrower.

## Idempotency & degrade-safety

- `first_seen_at` is **insert-only** in the ingest upsert
  (`src/lib/db/catalog-upsert.ts` excludes it from `onConflictDoUpdate`;
  asserted by `scripts/smoke-catalog-upsert.ts`). Existing rows before the
  migration have `NULL` first_seen_at and are never treated as new.
- Every **evaluated** search gets `last_alert_at` stamped, matched or not, so
  re-running dispatch inside the 6-day cooldown is a no-op and the
  `{processed, remaining}` loop always terminates.
- Missing `ALERTS_DISPATCH_TOKEN` → endpoint locked closed (401).
- Missing `RESEND_API_KEY` → `sendEmail` returns `skipped` (logged in
  `email_log`); dispatch still stamps and returns 200.
- Max 20 saved searches per user; digests cap at 10 matches per search.
- Users can toggle alerts per search on `/account`; email recipients can
  one-click unsubscribe without an account (RFC 8058 header + footer link).
