#!/usr/bin/env node
/**
 * Ping IndexNow after a deploy so Bing/SearchGPT/Copilot index new/updated pages immediately.
 * Usage: node scripts/indexnow-ping.mjs
 * Run this AFTER deploying (key file must be live at the canonical domain).
 *
 * Deploy commands:
 *   Production:  npm run deploy:production
 *   Preview:     npm run deploy
 *
 * Then: node scripts/indexnow-ping.mjs
 *
 * NOTE: The repo also has scripts/indexnow-submit.mjs using key "investoffplan-indexnow-2026"
 * and targeting www.bing.com/indexnow. This script uses a second key and targets
 * api.indexnow.org (which fans out to Bing, Yandex, and other participating engines).
 */

import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const KEY = "b3f8a2e1c4d95071f6e3b8a7d2c41089"
const HOST = "investoffplan.com"
const SITEMAP_URL = `https://${HOST}/sitemap.xml`
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

// Read the sitemap and extract all <loc> URLs
async function fetchSitemapUrls(sitemapUrl) {
  console.log(`Fetching sitemap: ${sitemapUrl}`)
  const res = await fetch(sitemapUrl)
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`)
  const xml = await res.text()

  // Handle sitemap index (links to child sitemaps)
  const sitemapMatches = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>/g)]
  if (sitemapMatches.length > 0) {
    const childUrls = []
    for (const m of sitemapMatches) {
      childUrls.push(...await fetchSitemapUrls(m[1].trim()))
    }
    return childUrls
  }

  // Regular sitemap
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim())
}

async function ping(urls) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  })

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  })

  return { status: res.status, text: await res.text() }
}

// IndexNow accepts max 10,000 URLs per request; batch if needed
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  let urls
  try {
    urls = await fetchSitemapUrls(SITEMAP_URL)
  } catch (e) {
    console.error("Could not fetch live sitemap. Running offline — pinging key pages only.")
    urls = [
      `https://${HOST}/`,
      `https://${HOST}/projects`,
      `https://${HOST}/communities`,
      `https://${HOST}/developers`,
      `https://${HOST}/sold-prices`,
      `https://${HOST}/market-report`,
      `https://${HOST}/faq`,
    ]
  }

  console.log(`Total URLs to ping: ${urls.length}`)
  const batches = chunk(urls, 10000)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`Pinging batch ${i + 1}/${batches.length} (${batch.length} URLs)...`)
    const { status, text } = await ping(batch)
    console.log(`Response: ${status} ${text}`)
    if (status === 200 || status === 202) {
      console.log(`✓ Batch ${i + 1} accepted`)
    } else {
      console.warn(`⚠ Unexpected status ${status}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
