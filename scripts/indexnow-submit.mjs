/**
 * IndexNow batch submission — run after every production deploy.
 *
 *   node scripts/indexnow-submit.mjs
 *
 * Fetches the live sitemap index, expands every child sitemap, deduplicates
 * the URL list, then POSTs in batches of 10,000 to api.indexnow.org.
 * IndexNow notifies Bing, Yandex, and other participating engines immediately.
 */

const KEY = "investoffplan-indexnow-2026";
const HOST = "investoffplan.com";
const SITEMAP_INDEX = `https://${HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  return r.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function collectUrls() {
  const indexXml = await fetchText(SITEMAP_INDEX);
  const childSitemaps = extractLocs(indexXml).filter((u) => u.includes("/sitemap/"));

  if (childSitemaps.length === 0) {
    console.warn("No child sitemaps found — submitting sitemap index URL only");
    return extractLocs(indexXml);
  }

  const all = [];
  for (const url of childSitemaps) {
    const xml = await fetchText(url);
    const locs = extractLocs(xml);
    all.push(...locs);
    const label = url.split("/").pop();
    console.log(`  ${label} → ${locs.length} URLs`);
  }
  return [...new Set(all)];
}

async function submitBatch(urls) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  });
  const r = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  });
  return r.status;
}

const urls = await collectUrls();
console.log(`\nTotal URLs: ${urls.length}`);

let batchNum = 0;
for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  batchNum++;
  const batch = urls.slice(i, i + BATCH_SIZE);
  const status = await submitBatch(batch);
  const label = status === 202 ? "accepted" : status === 200 ? "ok" : `HTTP ${status}`;
  console.log(`Batch ${batchNum} (${batch.length} URLs) → ${label}`);
}
console.log("Done.");
