// YouTube Data API v3 ingest pipeline for the Invest Off Plan brand channel.
//
// Enumerates every catalog project that has a real, embeddable video, generates
// SEO-optimized YouTube snippets (title/description/tags), and — once Rami has
// completed the one-time OAuth handshake — resumably uploads pre-downloaded
// video files to the brand channel and files them into a playlist.
//
// Node ESM, no external deps (Node built-in fetch + raw REST). Mirrors the media
// classification in src/lib/media.ts (isEmbeddableVideo / parseMedia). Matches
// the conventions of scripts/sync-catalog-public.mjs and the other data scripts.
//
// Channel:  UCsB7wB-BRCdy46IJSRAm2JA  (Invest off Plan)
// GCP proj: corded-pivot-502106-u8   (YouTube Data API v3 ENABLED)
// OAuth:    Desktop-app client "investoffplan-youtube" — creds live at
//           ~/.iop-youtube-oauth (KEY=value, chmod 600); refresh token stored at
//           ~/.iop-youtube-refresh-token (chmod 600). Secrets are NEVER printed.
//
// Commands (see docs/youtube-ingest.md for the full runbook):
//   node scripts/youtube-ingest.mjs [--dry-run]                  (default) build manifest, no network
//   node scripts/youtube-ingest.mjs --auth [--creds <path>]      one-time OAuth (loopback 127.0.0.1)
//   node scripts/youtube-ingest.mjs --upload [--limit N] [--from <dir>]   resumable upload of pending items
//   node scripts/youtube-ingest.mjs --help

import {
  chmodSync,
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { basename, extname, join, resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const CATALOG = join(ROOT, "data", "catalog.json");
const MANIFEST = join(ROOT, "data", "youtube-ingest-manifest.json");
const CREDS_DEFAULT = join(homedir(), ".iop-youtube-oauth");
const REFRESH_TOKEN_PATH = join(homedir(), ".iop-youtube-refresh-token");

const SITE = "https://investoffplan.com";
const CHANNEL_ID = "UCsB7wB-BRCdy46IJSRAm2JA";
const CHANNEL_TITLE = "Invest off Plan";
const PLAYLIST_TITLE = "Off-Plan Property Tours";
const CATEGORY_ID = "19"; // Travel & Events
const PRIVACY_STATUS = "unlisted";

// OAuth scopes: upload = insert videos; youtube = manage playlists / playlistItems.
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
];

// Quota accounting (units): videos.insert = 1600, playlistItems.insert = 50.
// Default daily project quota is 10,000 units → ~6 uploads/day.
const QUOTA_UPLOAD = 1600;
const QUOTA_PLAYLIST_INSERT = 50;
const QUOTA_PER_VIDEO = QUOTA_UPLOAD + QUOTA_PLAYLIST_INSERT;

// YouTube hard limits.
const MAX_TITLE = 100;
const MAX_DESCRIPTION = 5000;
const MAX_TAGS_TOTAL = 500; // total characters across all tags (approx cap)

// ─────────────────────────────────────────────────────────────────────────────
// Media classification — mirrors src/lib/media.ts (parseMedia / isEmbeddableVideo)
// ─────────────────────────────────────────────────────────────────────────────

function parseMedia(raw) {
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    if (h === "youtube.com" || h === "m.youtube.com" || h === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("/")[0] || u.pathname.split("/shorts/")[1]?.split("/")[0];
      if (id) return { kind: "youtube", id, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }
    if (h === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "youtube", id, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }
    if (h === "vimeo.com" || h === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { kind: "vimeo", id };
    }
    if (h.endsWith("matterport.com")) return { kind: "matterport" };
    if (/\.mp4($|\?)/i.test(u.pathname)) return { kind: "file" };
  } catch {
    // fall through
  }
  return { kind: "link" };
}

/** True for a video that plays inside the PDP (never an external link-out). */
function isEmbeddableVideo(raw) {
  if (!raw) return false;
  const k = parseMedia(raw).kind;
  return k === "youtube" || k === "vimeo" || k === "file";
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const AED = new Intl.NumberFormat("en-AE");

function firstSegment(s) {
  return (s || "").split(",")[0].trim();
}

/** Absolute thumbnail: YouTube poster if available, else the catalog imageUrl. */
function thumbnailFor(project, media) {
  if (media.poster) return media.poster;
  const img = project.imageUrl || "";
  if (!img) return "";
  if (/^https?:\/\//.test(img)) return img;
  return `${SITE}${img.startsWith("/") ? "" : "/"}${img}`;
}

function minPriceOf(project) {
  if (typeof project.minPriceAed === "number") return project.minPriceAed;
  const prices = (project.units || []).map((u) => u.launchPriceAed).filter((n) => Number.isFinite(n));
  return prices.length ? Math.min(...prices) : null;
}

/** A #Hashtag from an arbitrary phrase (letters/digits only, PascalCased). */
function hashtag(phrase) {
  const parts = String(phrase || "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const joined = parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  return joined ? `#${joined}` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Enumerate — every project with an embeddable / ingestable video
// ─────────────────────────────────────────────────────────────────────────────

function enumerateVideos(catalog) {
  const seen = new Set();
  const out = [];
  for (const p of catalog.projects || []) {
    const videoSource = p.videoUrl;
    if (!isEmbeddableVideo(videoSource)) continue;
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    const media = parseMedia(videoSource);
    out.push({
      projectSlug: p.slug,
      projectName: p.name,
      developer: p.developer,
      area: p.area,
      city: p.city,
      minPriceAed: minPriceOf(p),
      handover: p.handover || null,
      videoSource,
      videoKind: media.kind,
      thumbnail: thumbnailFor(p, media),
    });
  }
  // Stable order for deterministic manifests.
  out.sort((a, b) => a.projectSlug.localeCompare(b.projectSlug));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata generator — pure function: record → YouTube snippet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a YouTube snippet for one enumerated video record.
 * Pure: no I/O, no network. Deterministic given the record.
 */
export function buildSnippet(rec) {
  const area = firstSegment(rec.area) || rec.area || "";
  const city = rec.city || "UAE";

  // Title ≤ 100 chars: "{project} by {developer} — Off-Plan in {area}, {city} | Property Tour".
  const suffix = " | Property Tour";
  const loc = area ? `${area}, ${city}` : city;
  let title = `${rec.projectName} by ${rec.developer} — Off-Plan in ${loc}${suffix}`;
  if (title.length > MAX_TITLE) {
    // Drop the marketing suffix first, then hard-truncate on a word boundary.
    title = `${rec.projectName} by ${rec.developer} — Off-Plan in ${loc}`;
    if (title.length > MAX_TITLE) title = truncate(title, MAX_TITLE);
  }

  // Description.
  const blurb = `Explore ${rec.projectName}, an off-plan property by ${rec.developer} in ${loc}.`;
  const priceLine = rec.minPriceAed != null ? `From AED ${AED.format(rec.minPriceAed)}` : null;
  const handoverLine = rec.handover ? `Handover ${rec.handover}` : null;
  const pdpUrl = `${SITE}/projects/${rec.projectSlug}`;
  const brandLine =
    "Invest Off Plan — Dubai & UAE off-plan property tours, prices and payment plans. " +
    `${SITE}`;
  const tags = buildTags(rec, area, city);
  const hashtags = uniqueHashtags([
    "#OffPlan",
    "#Dubai",
    hashtag(rec.developer),
    hashtag(area),
    "#UAEProperty",
    "#DubaiRealEstate",
    "#PropertyTour",
    "#RealEstate",
  ]).join(" ");

  const description = [
    blurb,
    "",
    [priceLine, handoverLine].filter(Boolean).join("\n"),
    "",
    `Details & enquiries: ${pdpUrl}`,
    "",
    brandLine,
    "",
    hashtags,
  ]
    .filter((line) => line !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_DESCRIPTION);

  return { title, description, tags, categoryId: CATEGORY_ID, defaultLanguage: "en" };
}

function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function buildTags(rec, area, city) {
  const raw = [
    rec.projectName,
    rec.developer,
    area,
    city,
    `${rec.developer} ${area}`.trim(),
    `${rec.projectName} ${city}`.trim(),
    "Dubai off plan",
    "off plan property",
    "UAE property",
    "Dubai real estate",
    "property tour",
    "off plan Dubai",
    "new launch Dubai",
    "invest off plan",
  ]
    .map((t) => String(t || "").trim())
    .filter(Boolean);

  // Dedupe (case-insensitive) then cap at YouTube's ~500-char total budget.
  const seen = new Set();
  const deduped = [];
  for (const t of raw) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(t);
  }
  return capTags(deduped, MAX_TAGS_TOTAL);
}

/** Cap tags so the summed length (a tag with a space is quoted → +2) stays ≤ max. */
function capTags(tags, max) {
  const out = [];
  let total = 0;
  for (const t of tags) {
    const cost = t.length + (t.includes(" ") ? 2 : 0) + (out.length ? 1 : 0);
    if (total + cost > max) break;
    out.push(t);
    total += cost;
  }
  return out;
}

function uniqueHashtags(list) {
  const seen = new Set();
  const out = [];
  for (const h of list) {
    if (!h) continue;
    const k = h.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest build (dry-run)
// ─────────────────────────────────────────────────────────────────────────────

function loadExistingManifest() {
  if (!existsSync(MANIFEST)) return [];
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildManifest(records, existing) {
  // Preserve upload progress (videoId / uploaded status) across re-runs — never
  // clobber a completed ingest just because the snippet was regenerated.
  const prior = new Map(existing.map((it) => [it.slug, it]));
  return records.map((rec) => {
    const snippet = buildSnippet(rec);
    const prev = prior.get(rec.projectSlug);
    const done = prev && prev.status === "uploaded" && prev.videoId;
    return {
      slug: rec.projectSlug,
      projectName: rec.projectName,
      developer: rec.developer,
      area: rec.area,
      city: rec.city,
      minPriceAed: rec.minPriceAed,
      handover: rec.handover,
      videoSource: rec.videoSource,
      videoKind: rec.videoKind,
      thumbnail: rec.thumbnail,
      channelId: CHANNEL_ID,
      playlist: PLAYLIST_TITLE,
      snippet,
      status: done ? "uploaded" : "pending",
      videoId: done ? prev.videoId : null,
      playlistItemId: done ? prev.playlistItemId ?? null : null,
      uploadedAt: done ? prev.uploadedAt ?? null : null,
    };
  });
}

function runDryRun() {
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
  const records = enumerateVideos(catalog);
  const existing = loadExistingManifest();
  const manifest = buildManifest(records, existing);

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const pending = manifest.filter((m) => m.status === "pending");
  const uploaded = manifest.filter((m) => m.status === "uploaded");
  const byKind = manifest.reduce((acc, m) => {
    acc[m.videoKind] = (acc[m.videoKind] || 0) + 1;
    return acc;
  }, {});

  console.log("[youtube-ingest] dry-run — no network, no auth");
  console.log(`  channel : ${CHANNEL_TITLE} (${CHANNEL_ID})`);
  console.log(`  playlist: ${PLAYLIST_TITLE}`);
  console.log(`  videos  : ${manifest.length} enumerated  (${JSON.stringify(byKind)})`);
  console.log(`  pending : ${pending.length}   uploaded: ${uploaded.length}`);
  console.log(`  manifest: ${MANIFEST}`);
  console.log("");
  console.log("  sample titles:");
  for (const m of manifest.slice(0, 4)) {
    console.log(`   • ${m.snippet.title}  (${m.snippet.title.length} chars)`);
  }
  console.log("");
  const estQuota = pending.length * QUOTA_PER_VIDEO;
  console.log(
    `  est. quota to upload all pending: ${pending.length} × ${QUOTA_PER_VIDEO} = ${estQuota} units ` +
      `(${QUOTA_UPLOAD} insert + ${QUOTA_PLAYLIST_INSERT} playlist); daily cap 10,000 → ~6 uploads/day`,
  );
  console.log("");
  console.log("  next: `node scripts/youtube-ingest.mjs --auth` (one-time), then `--upload --from <dir>`");
}

// ─────────────────────────────────────────────────────────────────────────────
// Credentials
// ─────────────────────────────────────────────────────────────────────────────

/** Parse KEY=value credential file. Returns { clientId, clientSecret } or null. */
function readCreds(path) {
  if (!existsSync(path)) return null;
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toUpperCase();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  const clientId =
    env.CLIENT_ID || env.IOP_YOUTUBE_CLIENT_ID || env.YOUTUBE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
  const clientSecret =
    env.CLIENT_SECRET ||
    env.IOP_YOUTUBE_CLIENT_SECRET ||
    env.YOUTUBE_CLIENT_SECRET ||
    env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function printCredsHelp(credsPath) {
  console.log("[youtube-ingest] Desktop OAuth client credentials not found.");
  console.log(`  Expected KEY=value file at: ${credsPath}`);
  console.log("");
  console.log("  One-time steps for Rami (secure-keys handshake — creds never touch chat):");
  console.log("   1. In GCP project corded-pivot-502106-u8, open the OAuth client");
  console.log('      "investoffplan-youtube" (Desktop app) and copy its Client ID + Client secret.');
  console.log(`   2. Write them to ${credsPath} as:`);
  console.log("        CLIENT_ID=xxxxxxxx.apps.googleusercontent.com");
  console.log("        CLIENT_SECRET=xxxxxxxx");
  console.log(`   3. chmod 600 ${credsPath}`);
  console.log("   4. Re-run: node scripts/youtube-ingest.mjs --auth");
  console.log("");
  console.log("  (Exiting 0 — nothing to do until the credentials exist.)");
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth — loopback 127.0.0.1 flow for Desktop clients (--auth)
// ─────────────────────────────────────────────────────────────────────────────

async function runAuth(args) {
  const credsPath = args.creds || CREDS_DEFAULT;
  const creds = readCreds(credsPath);
  if (!creds) {
    printCredsHelp(credsPath);
    process.exit(0);
  }

  if (existsSync(REFRESH_TOKEN_PATH)) {
    console.log(`[youtube-ingest] A refresh token already exists at ${REFRESH_TOKEN_PATH}.`);
    console.log("  Re-authing will overwrite it. Delete that file first if you want to force a fresh grant.");
    console.log("  Continuing to mint a new token…");
  }

  const { code, redirectUri, server } = await captureAuthCode(creds.clientId);
  try {
    const tokens = await exchangeCode(creds, code, redirectUri);
    if (!tokens.refresh_token) {
      console.error(
        "[youtube-ingest] Google did not return a refresh_token. Revoke prior access at " +
          "https://myaccount.google.com/permissions and re-run --auth (we force prompt=consent).",
      );
      process.exit(1);
    }
    writeFileSync(REFRESH_TOKEN_PATH, `${tokens.refresh_token}\n`, { mode: 0o600 });
    chmodSync(REFRESH_TOKEN_PATH, 0o600);
    console.log(`[youtube-ingest] Refresh token stored (chmod 600) at ${REFRESH_TOKEN_PATH}.`);
    console.log("  (Token value NOT printed.) You can now run: node scripts/youtube-ingest.mjs --upload --from <dir>");
  } finally {
    server.close();
  }
}

function captureAuthCode(clientId) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname !== "/") {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<html><body style="font-family:system-ui;padding:3rem;text-align:center">` +
          `<h2>${code ? "Authorization received ✓" : "Authorization failed"}</h2>` +
          `<p>${code ? "You can close this tab and return to the terminal." : `Error: ${err || "unknown"}`}</p>` +
          `</body></html>`,
      );
      if (code) resolvePromise({ code, redirectUri, server });
      else rejectPromise(new Error(`OAuth error: ${err || "no code returned"}`));
    });

    server.on("error", rejectPromise);
    let redirectUri;
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      redirectUri = `http://127.0.0.1:${port}`;
      const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: SCOPES.join(" "),
          access_type: "offline",
          prompt: "consent",
        }).toString();
      console.log("[youtube-ingest] Open this URL in a browser, sign in as the Invest off Plan channel owner,");
      console.log("  and approve access. This terminal is waiting for the redirect…");
      console.log("");
      console.log(`  ${authUrl}`);
      console.log("");
    });
  });
}

async function exchangeCode(creds, code, redirectUri) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${json.error || "unknown"} ${json.error_description || ""}`);
  }
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload (--upload) — resumable videos.insert + playlist filing
// ─────────────────────────────────────────────────────────────────────────────

async function refreshAccessToken(creds) {
  const refreshToken = readFileSync(REFRESH_TOKEN_PATH, "utf8").trim();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Access-token refresh failed (${res.status}): ${json.error || "unknown"}`);
  }
  return json.access_token;
}

async function apiGet(path, token) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(json.error || json)}`);
  return json;
}

async function apiPost(path, token, body) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${JSON.stringify(json.error || json)}`);
  return json;
}

async function ensurePlaylist(token, title) {
  let pageToken;
  do {
    const q = `playlists?part=snippet&mine=true&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const page = await apiGet(q, token);
    const found = (page.items || []).find((p) => p.snippet?.title === title);
    if (found) return found.id;
    pageToken = page.nextPageToken;
  } while (pageToken);
  const created = await apiPost("playlists?part=snippet,status", token, {
    snippet: { title, description: "Off-plan property video tours across Dubai & the UAE — Invest Off Plan." },
    status: { privacyStatus: PRIVACY_STATUS },
  });
  return created.id;
}

async function addToPlaylist(token, playlistId, videoId) {
  const res = await apiPost("playlistItems?part=snippet", token, {
    snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } },
  });
  return res.id;
}

const MIME = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
};

/** Find <slug>.<ext> in dir (basename without extension === slug). */
function findVideoFile(dir, slug) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  for (const name of entries) {
    const ext = extname(name).toLowerCase();
    if (!MIME[ext]) continue;
    if (basename(name, extname(name)) === slug) return join(dir, name);
  }
  return null;
}

async function resumableUpload(token, filePath, item) {
  const size = statSync(filePath).size;
  const mime = MIME[extname(filePath).toLowerCase()] || "video/*";
  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mime,
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify({
        snippet: {
          title: item.snippet.title,
          description: item.snippet.description,
          tags: item.snippet.tags,
          categoryId: item.snippet.categoryId,
          defaultLanguage: item.snippet.defaultLanguage,
        },
        status: {
          privacyStatus: PRIVACY_STATUS,
          selfDeclaredMadeForKids: false,
          embeddable: true,
        },
      }),
    },
  );
  if (!init.ok) {
    const j = await init.json().catch(() => ({}));
    throw new Error(`resumable init failed (${init.status}): ${JSON.stringify(j.error || j)}`);
  }
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new Error("resumable init returned no upload URL");

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mime, "Content-Length": String(size) },
    body: createReadStream(filePath),
    duplex: "half",
  });
  const result = await put.json();
  if (!put.ok || !result.id) {
    throw new Error(`upload PUT failed (${put.status}): ${JSON.stringify(result.error || result)}`);
  }
  return result.id;
}

async function runUpload(args) {
  const credsPath = args.creds || CREDS_DEFAULT;
  const creds = readCreds(credsPath);
  if (!creds) {
    printCredsHelp(credsPath);
    process.exit(1);
  }
  if (!existsSync(REFRESH_TOKEN_PATH)) {
    console.error(`[youtube-ingest] No refresh token at ${REFRESH_TOKEN_PATH}.`);
    console.error("  Run the one-time OAuth first: node scripts/youtube-ingest.mjs --auth");
    process.exit(1);
  }
  if (!existsSync(MANIFEST)) {
    console.error(`[youtube-ingest] No manifest at ${MANIFEST}. Run --dry-run first to enumerate videos.`);
    process.exit(1);
  }
  const fromDir = args.from ? resolve(args.from) : null;
  if (!fromDir) {
    console.error("[youtube-ingest] --upload requires --from <dir> containing pre-downloaded <slug>.<ext> video files.");
    console.error("  Sourcing the video files from developer pages is a separate, Rami-consented step (see docs/youtube-ingest.md).");
    process.exit(1);
  }
  if (!existsSync(fromDir)) {
    console.error(`[youtube-ingest] --from dir does not exist: ${fromDir}`);
    process.exit(1);
  }

  const limit = Number.isFinite(args.limit) && args.limit > 0 ? Math.floor(args.limit) : 3;
  const manifest = loadExistingManifest();
  const pending = manifest.filter((m) => m.status === "pending");
  if (!pending.length) {
    console.log("[youtube-ingest] Nothing pending — all enumerated videos are already uploaded.");
    return;
  }

  console.log(`[youtube-ingest] upload: ${pending.length} pending, uploading up to ${limit} this run.`);
  console.log(
    `  ⚠ quota: each upload ≈ ${QUOTA_PER_VIDEO} units; daily cap 10,000 → ~6 uploads/day. ` +
      "Stay under the cap or videos.insert starts returning 403 quotaExceeded.",
  );

  const token = await refreshAccessToken(creds);
  const playlistId = await ensurePlaylist(token, PLAYLIST_TITLE);
  console.log(`  playlist "${PLAYLIST_TITLE}" → ${playlistId}`);

  let done = 0;
  for (const item of pending) {
    if (done >= limit) break;
    const file = findVideoFile(fromDir, item.slug);
    if (!file) {
      console.log(`  · ${item.slug}: no ${item.slug}.<ext> in --from dir — skipped (source video not downloaded yet)`);
      continue;
    }
    try {
      console.log(`  ↑ ${item.slug}: uploading ${basename(file)} …`);
      const videoId = await resumableUpload(token, file, item);
      const playlistItemId = await addToPlaylist(token, playlistId, videoId);
      item.status = "uploaded";
      item.videoId = videoId;
      item.playlistItemId = playlistItemId;
      item.uploadedAt = new Date().toISOString();
      writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      console.log(`    ✓ ${item.slug}: https://youtu.be/${videoId} (playlist item ${playlistItemId})`);
      done += 1;
    } catch (err) {
      console.error(`    ✗ ${item.slug}: ${err.message}`);
      // Do not mark uploaded; leave pending for the next run.
    }
  }
  console.log(`[youtube-ingest] uploaded ${done} this run. Re-run to continue (idempotent — done items are skipped).`);
}

// ─────────────────────────────────────────────────────────────────────────────
// argv + dispatch
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { dryRun: false, auth: false, upload: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--auth") args.auth = true;
    else if (a === "--upload") args.upload = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--from") args.from = argv[++i];
    else if (a === "--creds") args.creds = argv[++i];
    else console.error(`[youtube-ingest] unknown arg: ${a}`);
  }
  return args;
}

function printHelp() {
  console.log(`youtube-ingest — Data API v3 ingest for the Invest off Plan channel

Usage:
  node scripts/youtube-ingest.mjs [--dry-run]                   (default) build manifest, no network/auth
  node scripts/youtube-ingest.mjs --auth [--creds <path>]       one-time OAuth (loopback 127.0.0.1)
  node scripts/youtube-ingest.mjs --upload [--limit N] [--from <dir>] [--creds <path>]
  node scripts/youtube-ingest.mjs --help

Files:
  data/catalog.json                       source of project videos
  data/youtube-ingest-manifest.json       generated plan (committed)
  ~/.iop-youtube-oauth                     Desktop OAuth client (KEY=value, chmod 600)
  ~/.iop-youtube-refresh-token             stored refresh token (chmod 600, never printed)

See docs/youtube-ingest.md for the full runbook and quota math.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  if (args.auth) return runAuth(args);
  if (args.upload) return runUpload(args);
  // Default (and explicit --dry-run) → build the manifest.
  return runDryRun();
}

main().catch((err) => {
  console.error(`[youtube-ingest] error: ${err.message}`);
  process.exit(1);
});
