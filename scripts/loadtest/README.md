# scripts/loadtest/README.md — draft

## IOP load-test harness (k6)

**Install:** `brew install k6`

### ⚠️ Safety rules (non-negotiable)
1. **Preview shares PROD's D1 database** (`database_id e5aa2877-…c6a4` in BOTH wrangler configs) and its `AI` binding is `remote:true`. "Testing preview" still burns prod D1 quota and real Workers-AI neurons. There is no consequence-free target — that's why every cap below lives in code.
2. RPS and duration are **hard-capped in the scripts** (50 rps / 5 min pages; 30 rps catalog; advisor probe fixed 1 rps × 45 s). Env vars cannot exceed them.
3. **Never load-test `/api/leads`** — every accepted request writes D1 + fires 2 GHL calls + GA4 (someone else's quota).
4. Advisor probe expects **429s as the PASS criterion** — if no 429 appears, the rate limiter is broken; stop and fix before any bigger run.
5. Run prod scenarios **off-peak** (UAE early morning ≈ 02:00–06:00 GST) and watch the run live.

### Recipes
```bash
# 1. Shakedown vs preview (cheap, still shares prod D1 — keep short)
k6 run scripts/loadtest/k6-pages.js

# 2. Prod pages, capped (Rami-authorized: capped + off-peak)
BASE_URL=https://investoffplan.com MAX_RPS=20 DURATION_S=120 k6 run scripts/loadtest/k6-pages.js

# 3. Prod catalog APIs — ONLY after the catalog-cache wave is live
BASE_URL=https://investoffplan.com MAX_RPS=15 DURATION_S=90 k6 run scripts/loadtest/k6-catalog-api.js

# 4. Advisor limiter probe — ONLY after the guardrails wave is live
BASE_URL=https://investoffplan.com k6 run scripts/loadtest/k6-advisor-probe.js
```

### Pass criteria
| Scenario | Threshold |
|---|---|
| pages | p95 < 1.5 s, errors < 1% |
| catalog-api | p95 < 2 s, errors < 1%; `iop_edge_cache_hit` rate reported (expect ≫0 on prod domain; Cache API is a no-op on workers.dev) |
| advisor-probe | ≥1 × 429 observed, zero 5xx, ≤10 completions total |

### After each run
- Cloudflare dash → Workers & Pages → investoffplan → Metrics: error rate, CPU time, requests.
- D1 → investoffplan-catalog → Metrics: rows read delta.
- AI → Workers AI: neuron usage delta (advisor probe ≤ ~50 inferences).
- Any anomaly = same-day incident per cost-runaway directive.
