# Getting indexed

How InvestOffPlan's ~6,800 URLs get into search engines, what we can automate,
and what we can't.

## The short version

| Engine | Push mechanism | Status |
|---|---|---|
| Google | none available to us | sitemap + links only |
| Bing, Yandex | IndexNow | `scripts/indexnow-submit.mjs` |

For Google there is **no API shortcut to indexing**. The levers are sitemaps,
internal links, crawl budget, and authority. Everything else is watching.

## Google's Indexing API does not work here — don't try it

Google restricts the Indexing API to pages carrying `JobPosting`, or
`BroadcastEvent` embedded in a `VideoObject`. That restriction is in
[Google's own quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart).
IOP is property listings — our schema is `FAQPage`, `Organization`, `WebSite`,
`Question`, `Answer`. Neither qualifying type exists anywhere on the site, so
every URL we send is accepted and then silently discarded.

**The trap:** `urlNotifications:publish` returns **HTTP 200 for any URL**. On
2026-07-15 a submission run reported `199 submitted, 0 failed` and not one had
been recorded — `GET urlNotifications/metadata?url=…` answered
`Requested entity was not found` for all 199. A 200 means *accepted*, not
*recorded*. The metadata endpoint is the only honest check.

Cost of learning this: a day's 200-URL quota and four rounds of access
plumbing, for zero effect. Check content-type eligibility *before* building on
any Google indexing mechanism.

For the record, since it's the first thing you'd suspect: auth was never the
problem. The API needs a Search Console **Owner** — "Full" is rejected with
`403 Failed to verify the URL ownership` — and Owner isn't in the GSC
permissions dropdown. Delegated owners are added via the legacy page at
`google.com/webmasters/verification/details?domain=investoffplan.com`. All of
that was done, and it changed nothing.

## What actually moved the needle

Submitting the sitemap. On 2026-07-15 Google was sitting on a stale crawl of
the homepage from **July 4** and reporting
`coverageState: "Excluded by 'noindex' tag"` even though the live site has no
`noindex` anywhere and no `X-Robots-Tag` — verified on the live HTML, and the
codebase only sets `noindex` where it should (thin sold-prices pages). The
likely explanation is that on July 4 the domain was still serving the
pre-DNS-cutover placeholder, but that was never confirmed and no longer
matters. That single stale verdict suppressed crawl priority for everything
behind it.

Google downloaded the sitemap at `11:04:51Z` and re-crawled the homepage at
`14:03:13Z` the same day — `PASS`, `robotsTxtState: ALLOWED`,
`Submitted and indexed`. No Request Indexing click was needed.

The lesson worth keeping: a stale `noindex` verdict does not mean the site is
broken. Check `lastCrawlTime` before diagnosing anything.

## Monitoring — `scripts/gsc-index-monitor.mjs`

Daily via `.github/workflows/gsc-index-monitor.yml` (06:00 UTC / 10:00 Dubai),
plus `workflow_dispatch` for a manual run.

```bash
node scripts/gsc-index-monitor.mjs               # digest
node scripts/gsc-index-monitor.mjs --json        # machine-readable
node scripts/gsc-index-monitor.mjs --out f.json  # digest + JSON to a file
node scripts/gsc-index-monitor.mjs --prev f.json # diff against a past --out
```

It inspects ~20 must-be-indexable pages, pulls sitemap health and a 7d-vs-7d
impressions comparison, and **exits non-zero** when a human is needed:

- the homepage isn't indexed
- a page dropped out of the index since the last run
- a should-be-indexable page carries `noindex`
- the sitemap reports errors
- a page couldn't be inspected at all (unknown state — reported, not guessed)

An errored inspection is never counted as a deindexing. A transient 5xx meaning
"we don't know" must not page someone about a drop that didn't happen.

CI carries the previous run's snapshot forward via `actions/cache` (rolling key
+ `restore-keys` prefix), which is what makes the deindex check possible — the
job would otherwise be a snapshot that passes forever once the homepage is
green. Each run also uploads its JSON as a 90-day artifact, building a crawl
history you can diff.

**Watch `crawled, not indexed`.** That bucket is the thin-content signal — it's
how the 190 compare-developer pages will announce themselves if quality sags.

### Access

`scripts/lib/gsc-auth.mjs` resolves a credential in this order:

1. `GSC_SA_KEY` env var holding the key JSON (CI — a GitHub repo secret)
2. `~/.iop-indexing-sa.json` (local, `chmod 600`)

The service account is
`iop-indexing@corded-pivot-502106-u8.iam.gserviceaccount.com`, added to the
`sc-domain:investoffplan.com` property. It only needs **Full** — read scopes
(`webmasters.readonly`) are all the monitor uses. It was granted Owner for the
dead Indexing API and should be dropped back down.

To set the CI secret:

```bash
gh secret set GSC_SA_KEY --body "$(cat ~/.iop-indexing-sa.json)"
```

The key lives on `corded-pivot-502106-u8`, whose owner is
`admin@investoffplan.com` — `rami@emergedigital.com` lacks
`iam.serviceAccountKeys.create` there, so key rotation runs as `admin@`:

```bash
gcloud iam service-accounts keys create ~/.iop-indexing-sa.json \
  --iam-account=iop-indexing@corded-pivot-502106-u8.iam.gserviceaccount.com \
  --project=corded-pivot-502106-u8 --account=admin@investoffplan.com
```

### Reading the numbers

**Search Console collects nothing before the property is verified** (~2026-07-09
here). A 90-day `searchAnalytics` window will look like "8 impressions, site is
dead" when it's really five days of a new property. Always check the first date
in the series before reading a trend.

`searchAnalytics` only returns pages that already have impressions, so it
cannot see what's unindexed. `urlInspection` is the only endpoint that can —
that's why the monitor uses it.
