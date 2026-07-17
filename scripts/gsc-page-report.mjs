// Per-page Search Console performance for a URL-path slice of the site.
//
// Built for the Wave-2 thin-page verdict on the 190 /compare-developers/ pages:
// the property was verified 2026-07-09, so impressions history starts there
// (minus GSC's ~2-day lag). The decision protocol is dated, not vibes:
//   - baseline pull now (record what exists);
//   - ~Aug 7: noindex ONLY pages with 0 impressions across the full window;
//   - ~Aug 21: full verdict ≈28 days after the enrichment deploy.
// Each checkpoint re-runs this script and diffs against the recorded snapshot.
//
//   GSC_SA_KEY_FILE=~/.iop-indexing-sa.json node scripts/gsc-page-report.mjs
//   node scripts/gsc-page-report.mjs --path=/compare-developers/ --days=28 --out=data/gsc-compare-baseline.json
//
// Reuses scripts/lib/gsc-auth.mjs (read-only scope). Days are anchored to the
// ~2-day data lag like gsc-index-monitor.mjs, so "--days=28" means the 28 most
// recent days GSC actually has, not 26 real ones and 2 empty ones.
import { writeFileSync } from "node:fs";
import { getAccessToken, gscFetch, SITE_URL } from "./lib/gsc-auth.mjs";

const LAG_DAYS = 2;

function parseArgs() {
  const args = process.argv.slice(2);
  const val = (flag, dflt) => {
    const a = args.find((x) => x.startsWith(`${flag}=`));
    return a ? a.split("=").slice(1).join("=") : dflt;
  };
  return {
    pathFilter: val("--path", "/compare-developers/"),
    days: Number(val("--days", "28")),
    out: val("--out", null),
  };
}

const iso = (daysAgo) => {
  const d = new Date(Date.now() - daysAgo * 86400_000);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const { pathFilter, days, out } = parseArgs();
  const token = await getAccessToken();
  const site = encodeURIComponent(SITE_URL);
  const startDate = iso(days + LAG_DAYS);
  const endDate = iso(LAG_DAYS);

  const data = await gscFetch(token, `/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page"],
      dimensionFilterGroups: [
        {
          filters: [{ dimension: "page", operator: "contains", expression: pathFilter }],
        },
      ],
      rowLimit: 1000,
    }),
  });

  const rows = (data.rows ?? [])
    .map((r) => ({
      page: r.keys[0],
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      position: r.position != null ? Math.round(r.position * 10) / 10 : null,
    }))
    .sort((a, b) => b.impressions - a.impressions);

  const snapshot = {
    pulledAt: new Date().toISOString(),
    site: SITE_URL,
    pathFilter,
    window: { startDate, endDate, days },
    pagesWithData: rows.length,
    totals: {
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
    },
    rows,
  };

  console.log(
    `[gsc-pages] ${pathFilter} — window ${startDate}..${endDate}: ` +
      `${rows.length} page(s) with data, ${snapshot.totals.impressions} impressions, ${snapshot.totals.clicks} clicks`,
  );
  if (rows.length === 0) {
    // A real answer, not an error: with a young property this is the expected
    // baseline. The checkpoint scripts diff against it — record it faithfully.
    console.log("[gsc-pages] zero rows — GSC has no impressions for this slice yet.");
  } else {
    for (const r of rows.slice(0, 25)) {
      console.log(
        `  ${String(r.impressions).padStart(6)} impr  ${String(r.clicks).padStart(4)} clicks  pos ${String(r.position ?? "-").padStart(5)}  ${r.page.replace("https://investoffplan.com", "")}`,
      );
    }
    if (rows.length > 25) console.log(`  … ${rows.length - 25} more`);
  }

  if (out) {
    writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log(`[gsc-pages] snapshot → ${out}`);
  }
}

main().catch((e) => {
  console.error("[gsc-pages] Failed:", e.message);
  process.exit(1);
});
