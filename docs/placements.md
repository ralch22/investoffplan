# Paid Featured Placements

Paid featured-placement rails for investoffplan. A **placement** buys a project
a time-windowed slot on one of two surfaces:

| Surface | What it does |
|---|---|
| `home-featured` | Pinned first in the homepage "Featured" grid (before the editorial `featuredRank`/`isPremium` pool, which backfills to the grid size). |
| `serp-boost` | Pinned to the top of page 1 on `/projects` — **default "featured" sort only**. Explicit user sorts (price/handover/value) are never reordered by paid slots. |

Placements live in their own `placements` D1 table (migration
`drizzle/migrations/0008_placements.sql`) — **not** on `projects` — because the
weekly catalog ingest clobbers `projects` rows; a paid slot must survive
re-ingest. A placement is active when `starts_at <= now < featured_until`.

Leads submitted against a project with an active placement (`lead_priority >= 1`)
are forwarded to GHL with extra contact tags `premium-placement` +
`placement:<surface>` and the opportunity name prefixed `[FEATURED] `. The
retry cron (`/api/leads/retry`) re-derives the same tagging.

## Ad-disclosure rule

**Paid slots are always visibly labeled.** A serp-boost card renders the
"Featured" pill (Premium label style, text "Featured"). Never ship a placement
surface that shows a paid slot without a visible label — this is an ads
disclosure, not a styling choice.

## Propagation timing

- **Homepage (`home-featured`)**: the homepage is ISR with `revalidate = 3600`,
  so a created/expired placement surfaces within **≤ 1 hour**, not instantly.
- **SERP (`serp-boost`)**: `/api/catalog/projects` is `force-dynamic`, so the
  boost applies on the next request (client SERP fetches hit it live). The
  SSR'd default first page of `/projects` is also ISR (≤ 1 hour).
- Expiry is automatic — no cleanup call needed; expired rows simply stop
  matching the active window (delete them when you want the list tidy).

## Token setup (secure-keys handshake)

The admin API is guarded by the `x-admin-token` header matched against the
`PLACEMENTS_ADMIN_TOKEN` worker secret (timing-safe compare; **locked-closed** —
if the secret is unset every request is 401).

```bash
# 1. Generate + store locally (never paste the token into chat):
openssl rand -hex 32 > ~/.iop-placements-token && chmod 600 ~/.iop-placements-token

# 2. Push it to the worker (repeat with -c wrangler.production.jsonc for prod):
cd ~/Documents/investoffplan
npx wrangler secret put PLACEMENTS_ADMIN_TOKEN < ~/.iop-placements-token
```

## Curl workflow

```bash
BASE="https://investoffplan-preview.emerge-digital.workers.dev"  # or prod
TOKEN=$(cat ~/.iop-placements-token)
```

### Create / update a placement (PUT upsert)

Omit `id` to create; pass an existing `id` to update that row.

```bash
curl -s -X PUT "$BASE/api/admin/placements" \
  -H "x-admin-token: $TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "projectSlug": "sobha-one",
    "surface": "home-featured",
    "rank": 1,
    "featuredUntil": "2026-08-11T00:00:00Z",
    "leadPriority": 1,
    "notes": "August home slot — AED xxx / month"
  }' | jq
```

Fields: `surface` = `home-featured` | `serp-boost`; `rank` (default 100,
lower = higher on the surface); `startsAt` (ISO, default now); `featuredUntil`
(ISO, must be in the future — required); `leadPriority` (default 1; set 0 to
keep the visual slot but skip GHL lead tagging); `notes` free text.
`projectSlug` must exist in the D1 `projects` table (warn-not-block if the
lookup itself errors).

### List placements (with computed `active` flag)

```bash
curl -s "$BASE/api/admin/placements" -H "x-admin-token: $TOKEN" \
  | jq '.placements[] | {id, projectSlug, surface, rank, featuredUntil, active}'

# Only currently-active:
curl -s "$BASE/api/admin/placements" -H "x-admin-token: $TOKEN" \
  | jq '[.placements[] | select(.active)]'
```

### Expire a placement early

Either delete it:

```bash
curl -s -X DELETE "$BASE/api/admin/placements" \
  -H "x-admin-token: $TOKEN" \
  -H "content-type: application/json" \
  -d '{"id": "<placement-id>"}' | jq
```

…or PUT the same `id` with `featuredUntil` a minute in the future and let the
window close (keeps the row for bookkeeping).

### Apply the migration (one-time per environment)

```bash
npm run db:migrate:local    # local dev
npm run db:migrate:remote   # preview D1
# production: npx wrangler d1 migrations apply <prod-db> --remote -c wrangler.production.jsonc
```

Everything degrades gracefully before the migration/secret exist: no
placements table → all surfaces behave exactly as today; no
`PLACEMENTS_ADMIN_TOKEN` → admin API is 401-closed.

## Pricing (placeholder)

TBD with Rami/Jad. Suggested structure: flat monthly fee per surface slot
(home-featured > serp-boost), with lead-priority tagging bundled. Record the
agreed fee in `notes` on each placement until real billing exists.
