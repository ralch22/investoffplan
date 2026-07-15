/**
 * Google service-account auth for the Search Console API.
 *
 * Credential resolution, in order:
 *   1. GSC_SA_KEY env var holding the key JSON (CI — set as a GitHub secret)
 *   2. ~/.iop-indexing-sa.json (local)
 *
 * The SA is iop-indexing@corded-pivot-502106-u8.iam.gserviceaccount.com, added
 * to sc-domain:investoffplan.com in Search Console. Read scopes only.
 */

import { readFileSync, statSync } from "fs";
import { createSign } from "crypto";

const SA_KEY_PATH = `${process.env.HOME}/.iop-indexing-sa.json`;
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export const SITE_URL = "sc-domain:investoffplan.com";
export const SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";

function loadKey() {
  if (process.env.GSC_SA_KEY) {
    try {
      return JSON.parse(process.env.GSC_SA_KEY);
    } catch {
      throw new Error("GSC_SA_KEY is set but is not valid JSON");
    }
  }
  let size = 0;
  try {
    size = statSync(SA_KEY_PATH).size;
  } catch {
    throw new Error(
      `No credential. Set GSC_SA_KEY, or place the key at ${SA_KEY_PATH}.\n` +
        `  gcloud iam service-accounts keys create ${SA_KEY_PATH} \\\n` +
        `    --iam-account=iop-indexing@corded-pivot-502106-u8.iam.gserviceaccount.com \\\n` +
        `    --project=corded-pivot-502106-u8 --account=admin@investoffplan.com`,
    );
  }
  // A 0-byte file reads as "absent" to a naive try/catch. Say what's actually wrong.
  if (size === 0) throw new Error(`${SA_KEY_PATH} exists but is EMPTY (0 bytes) — the key was never written.`);
  return JSON.parse(readFileSync(SA_KEY_PATH, "utf8"));
}

export async function getAccessToken(scope = SCOPE_READONLY) {
  const sa = loadKey();
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: sa.client_email, scope, aud: TOKEN_ENDPOINT, exp: now + 3600, iat: now }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(sa.private_key, "base64url")}`;

  const r = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(d)}`);
  return d.access_token;
}

export async function gscFetch(token, path, init = {}) {
  const r = await fetch(`https://searchconsole.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const d = await r.json();
  if (d.error) throw new Error(`${path} → ${d.error.status}: ${d.error.message}`);
  return d;
}

/** Live index verdict for one URL. Quota: 2,000/day, 600/min. */
export async function inspectUrl(token, url) {
  const d = await gscFetch(token, "/v1/urlInspection/index:inspect", {
    method: "POST",
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
  });
  const r = d.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: r.verdict ?? "UNKNOWN",
    coverageState: r.coverageState ?? "unknown",
    lastCrawlTime: r.lastCrawlTime ?? null,
    robotsTxtState: r.robotsTxtState ?? null,
    pageFetchState: r.pageFetchState ?? null,
    indexed: (r.coverageState ?? "").toLowerCase().includes("indexed") && r.verdict === "PASS",
  };
}
