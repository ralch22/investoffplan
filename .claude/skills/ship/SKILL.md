---
name: ship
description: The investoffplan ship cadence — gate → merge → deploy → live-verify with every hard-won gotcha (shared .next races, port 3010, worktree locks, D1 seed field-loss, verify on investoffplan.com not the preview worker). Load before building, testing, deploying, or reseeding this repo.
---

# investoffplan ship cadence

Deploy target: worker `investoffplan` → **https://investoffplan.com** (routes). The `investoffplan-preview` worker is a SEPARATE stale deployable — **never verify prod changes on `*-preview.workers.dev`**.

## The cadence (every PR)

```bash
# 0. exclusive access check — NOTHING else may build in this repo
pgrep -f "jest-worker|next build|next dev" | wc -l   # must be 0
# 1. branch from fresh origin/main
git fetch origin && git checkout -b feat/x origin/main
# 2. implement → COMMIT EARLY (parallel sessions have reset uncommitted work)
npx tsc --noEmit                                      # 0 errors
# 3. e2e gate (see Port hygiene below first)
npx playwright test                                   # currently 101 tests, grows
# 4. ship
git push -u origin feat/x && gh pr create ... && gh pr merge feat/x --squash
git checkout main && git fetch origin && git reset --hard origin/main   # local-drift gotcha
# 5. deploy (also repopulates the R2 ISR cache — the "N/…" progress bar IS the cache populate)
CLOUDFLARE_ACCOUNT_ID=4a75e91d6fca8bc58467fb80ce1b9c2e npm run deploy:production
# 6. live verify with cache-buster
curl -s "https://investoffplan.com/<page>?cb=$(date +%s)" | grep <expected>
```

## Port / process hygiene (phantom-failure prevention)

Before EVERY e2e run:
```bash
pkill -9 -f "next dev|next-server|next build|next start"; \
p=$(lsof -ti :3010); [ -n "$p" ] && kill -9 $p; rm -rf .next/dev; sleep 2
```
- `pkill "next start"` does NOT kill `next-server` children — zombies answer :3010 with stale pages → phantom failures.
- `.next/dev/lock` from a dev server blocks `next build` ("Another next build process is already running").
- **NEVER two e2e runs or two builds concurrently** (subagents included — tell worktree agents NOT to run playwright; the orchestrator gates). Two builds in one `.next` corrupt each other's `_buildManifest.js.tmp.*`.
- ECONNREFUSED-only e2e failures = the server died / port collision, not real regressions — clear and re-run.

## Worktree subagent pattern

Parallel implementation via agents with `isolation: worktree` works well, BUT: a branch checked out in an agent worktree **cannot be checked out in the main tree** — `git worktree remove --force .claude/worktrees/agent-* && git worktree prune` after each agent finishes, BEFORE gating its branch. If a `git checkout <branch>` errors "already used by worktree", your subsequent commands are running on the WRONG branch — verify `git branch --show-current` before trusting any gate result.

## D1 seeding (data-loss trap)

- `npm run db:seed:local` = `scripts/migrate-catalog-to-d1.ts`; `npm run db:seed:remote` exports LOCAL D1 → remote. **The seed script's project mapping must stay in sync with `src/lib/db/prepare-catalog-rows.ts`** — it once silently dropped 6 fields (descriptionUnique, floorPlans, salesStartDate, ownershipType, constructionProgress, pfFaqs) and every remote seed wiped them from prod (PDPs lost Floor plans/FAQs as hourly ISR refreshed). When adding a `projects` column: add it to BOTH files, and exclude insert-only columns (e.g. `first_seen_at`) from the ingest `onConflictDoUpdate` set in `src/lib/db/catalog-upsert.ts` or the weekly ingest clobbers them.
- Verify after any reseed: `wrangler d1 execute investoffplan-catalog --remote -c wrangler.production.jsonc --command "SELECT SUM(CASE WHEN description_unique IS NOT NULL THEN 1 ELSE 0 END) uniq, SUM(CASE WHEN floor_plans IS NOT NULL THEN 1 ELSE 0 END) plans FROM projects"` → expect ~721/~596.
- Column names in D1 are snake_case (`sales_start_date`), drizzle fields camelCase.

## Caching model

- Pages: SSG/ISR `revalidate=3600` (layout-level) → deploys reach the edge within ~1h; a stale page ≠ failed deploy — re-check with `?cb=` cache-buster. Data-layer changes (D1 reseed) show on fresh renders without a deploy.
- Build-time SSG bakes from `data/catalog.json` (NEXT_IS_BUILD=1 file mode); runtime renders read D1 — keep BOTH in sync (promote → `sync-catalog-public.mjs` → seed → deploy).
- Sitemap: root index served by `src/app/sitemap.xml/route.ts` + children by `src/app/sitemap/[id]/route.ts` (hand-rolled — Next's generateSitemaps 404s the root; groups in `src/lib/sitemap-groups.ts`).

## Pinned e2e contracts (never change these strings)

aria-label "Search the catalog" · heading /Latest launches/i · "Compare Projects" · button "Remove" · "More filters" / "Developer" / "Handover by" · link text "English"/"العربية".

## Data honesty rules

Verified claims only: no invented numbers/testimonials/RERA claims; DLD yields capped at 12% plausibility (`MAX_PLAUSIBLE_YIELD_PCT` — mirror it in any new artifact, see `scripts/sync-catalog-public.mjs`); `dld-area-stats.json` is server-only (pass pruned props to client components, never import it in `"use client"` files).
