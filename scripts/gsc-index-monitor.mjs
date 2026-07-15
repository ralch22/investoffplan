/**
 * Search Console index monitor — daily crawl/index health for investoffplan.com.
 *
 *   node scripts/gsc-index-monitor.mjs               # digest to stdout
 *   node scripts/gsc-index-monitor.mjs --json        # machine-readable
 *   node scripts/gsc-index-monitor.mjs --out f.json  # digest + JSON to a file
 *   node scripts/gsc-index-monitor.mjs --prev f.json # diff against a past --out
 *
 * Answers the question the Indexing API could not: is Google actually crawling
 * and indexing us? (That API is restricted to JobPosting/BroadcastEvent and
 * silently discards everything else — see docs/seo-indexing.md.)
 *
 * Exits non-zero when something needs a human: the homepage isn't indexed, a
 * page dropped out of the index since the last run, a should-be-indexable page
 * carries noindex, or the sitemap errored. In CI that failure is the alert.
 *
 * Quota: URL Inspection allows 2,000/day, 600/min. This uses one call per
 * watched page (20), plus two searchAnalytics calls and one sitemaps call.
 */

import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { getAccessToken, gscFetch, inspectUrl, SITE_URL } from "./lib/gsc-auth.mjs";

const BASE = "https://investoffplan.com";
const DELAY_MS = 250;

// Pages that must be indexable. A noindex here is a defect, not a policy choice.
const WATCH = [
  "/", "/projects", "/communities", "/developers", "/market-report",
  "/market-report/archive", "/sold-prices", "/compare", "/guides", "/faq",
  "/news", "/locations", "/about", "/contact", "/tools",
  "/tools/mortgage", "/tools/roi", "/tools/rent-vs-buy", "/ar", "/ar/projects",
].map((p) => `${BASE}${p}`);

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);
const sum = (rows, k) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
const flag = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
};

const token = await getAccessToken();
const site = encodeURIComponent(SITE_URL);

// ── Sitemap health ───────────────────────────────────────────────────────────
const smd = await gscFetch(token, `/webmasters/v3/sites/${site}/sitemaps`);
const sitemaps = (smd.sitemap ?? []).map((s) => ({
  path: s.path,
  lastDownloaded: s.lastDownloaded ?? null,
  errors: Number(s.errors ?? 0),
  warnings: Number(s.warnings ?? 0),
  isPending: !!s.isPending,
}));

// ── Search performance: last 7d vs prior 7d ──────────────────────────────────
const perf = async (start, end) => {
  const d = await gscFetch(token, `/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: ["date"], rowLimit: 100 }),
  });
  const rows = d.rows ?? [];
  return { impressions: sum(rows, "impressions"), clicks: sum(rows, "clicks"), days: rows.length };
};
// GSC data lags ~2 days; anchor both windows to that so the comparison is fair.
const recent = await perf(iso(9), iso(2));
const prior = await perf(iso(16), iso(10));

// ── Per-URL index verdicts ───────────────────────────────────────────────────
const results = [];
for (const url of WATCH) {
  try {
    results.push(await inspectUrl(token, url));
  } catch (e) {
    results.push({ url, verdict: "ERROR", coverageState: String(e.message).slice(0, 80), indexed: false });
  }
  await new Promise((r) => setTimeout(r, DELAY_MS));
}

// One bucket per page, so the summary always sums to the total — a page in an
// unnamed state is a state we should see, not one that vanishes from the count.
const bucketOf = (r) => {
  if (r.verdict === "ERROR") return "error";
  if (r.indexed) return "indexed";
  const c = r.coverageState.toLowerCase();
  if (c.includes("noindex")) return "noindex";
  if (c.includes("unknown to google")) return "undiscovered";
  if (c.includes("not indexed")) return "crawledNotIndexed"; // thin/quality signal
  return "other";
};
const by = (b) => results.filter((r) => bucketOf(r) === b);
const indexed = by("indexed");
const noindexed = by("noindex");
const undiscovered = by("undiscovered");
const crawledNotIndexed = by("crawledNotIndexed");
const errored = by("error");
const other = by("other");
const home = results.find((r) => r.url === `${BASE}/`);

// ── Diff against the previous run ────────────────────────────────────────────
// Without this the job is a snapshot, not a monitor: once the homepage is
// indexed the absolute checks below pass forever, and a page silently dropping
// out of the index would never fail anything.
let gained = [];
let lost = [];
let prevAt = null;
const prevPath = flag("--prev");
if (prevPath) {
  try {
    const prev = JSON.parse(readFileSync(prevPath, "utf8"));
    prevAt = prev.checkedAt ?? null;
    const was = new Map((prev.results ?? []).map((r) => [r.url, r.indexed]));
    // A URL absent from the previous run is new to the watch list, not a change.
    gained = results.filter((r) => r.indexed && was.get(r.url) === false).map((r) => r.url);
    // An errored inspection means "we don't know", not "it dropped out" — a
    // transient 5xx must never page someone about a deindexing that didn't
    // happen. It's reported as an error below instead.
    lost = results
      .filter((r) => !r.indexed && r.verdict !== "ERROR" && was.get(r.url) === true)
      .map((r) => r.url);
  } catch {
    // No previous snapshot (first run, or the cache expired) — not an error.
  }
}

// ── Problems worth waking someone for ────────────────────────────────────────
const problems = [];
if (home?.verdict === "ERROR") problems.push(`could not inspect the homepage — ${home.coverageState}`);
else if (!home?.indexed) problems.push(`homepage not indexed — "${home?.coverageState}" (last crawl ${home?.lastCrawlTime ?? "NEVER"})`);
for (const u of lost) problems.push(`DEINDEXED since last check: ${u.replace(BASE, "") || "/"}`);
// Surface unreadable pages rather than silently counting them as not-indexed.
if (errored.length) problems.push(`${errored.length} page(s) could not be inspected — state unknown`);
for (const r of noindexed) problems.push(`noindex on a should-be-indexable page: ${r.url.replace(BASE, "") || "/"}`);
for (const s of sitemaps.filter((s) => s.errors > 0)) problems.push(`sitemap ${s.path} has ${s.errors} error(s)`);
if (!sitemaps.length) problems.push("no sitemap registered in GSC");

// ── Report ───────────────────────────────────────────────────────────────────
const payload = { checkedAt: new Date().toISOString(), sitemaps, recent, prior, results, gained, lost, problems };

const outPath = flag("--out");
if (outPath) writeFileSync(outPath, JSON.stringify(payload, null, 2));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  const row = (label, group) =>
    group.length ? `  ${label.padEnd(22)}${String(group.length).padStart(3)}  (${Math.round((group.length / results.length) * 100)}%)` : null;
  const lines = [
    `GSC index health — ${SITE_URL}`,
    ``,
    `Coverage of ${results.length} watched pages:`,
    ...[
      row("indexed", indexed),
      row("not yet discovered", undiscovered),
      row("crawled, not indexed", crawledNotIndexed),
      row("excluded: noindex", noindexed),
      row("other", other),
      row("inspection FAILED", errored),
    ].filter(Boolean),
    ``,
    `Search performance (7d vs prior 7d):`,
    `  impressions  ${recent.impressions}  (prior ${prior.impressions})`,
    `  clicks       ${recent.clicks}  (prior ${prior.clicks})`,
    ``,
    `Sitemaps:`,
    ...sitemaps.map((s) => `  ${s.path} — downloaded ${s.lastDownloaded ?? "NEVER"}, ${s.errors} errors, ${s.warnings} warnings`),
    ``,
    `Per-page:`,
    ...results.map((r) => `  ${r.indexed ? "OK  " : "--  "}${(r.url.replace(BASE, "") || "/").padEnd(24)} ${r.coverageState}`),
  ];
  if (prevAt) {
    lines.push(``, `Since last check (${prevAt}):`);
    if (!gained.length && !lost.length) lines.push(`  no change`);
    for (const u of gained) lines.push(`  + now indexed:  ${u.replace(BASE, "") || "/"}`);
    for (const u of lost) lines.push(`  - DEINDEXED:    ${u.replace(BASE, "") || "/"}`);
  }
  if (problems.length) lines.push(``, `PROBLEMS (${problems.length}):`, ...problems.map((p) => `  ! ${p}`));
  else lines.push(``, `No problems.`);
  const out = lines.join("\n");
  console.log(out);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, "```\n" + out + "\n```\n");
  }
}

process.exit(problems.length ? 1 : 0);
