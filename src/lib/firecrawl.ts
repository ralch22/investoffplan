import { SITE_URL } from "./site-url";

const FIRECRAWL_BASE = (
  process.env.FIRECRAWL_API_BASE || "https://api.firecrawl.dev/v2"
).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;
// Firecrawl's hobby tier intermittently returns 402/429 under burst load even
// with credits available; a short backoff clears it. 5xx are also retried.
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([402, 408, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const PORTAL = "property" + "finder";

const SOCIAL_BLOCKED = [
  "instagram.com",
  "facebook.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "threads.net",
  "pinterest.com",
];

const EXTRA_BLOCKED = (process.env.FIRECRAWL_BLOCKED_DOMAINS || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const BLOCKED_DOMAINS = [...SOCIAL_BLOCKED, ...EXTRA_BLOCKED];
const PORTAL_HOST_RE = new RegExp(`(?:^|\\.)${PORTAL}\\.`, "i");

function ownHost(): string {
  try {
    return new URL(SITE_URL).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (PORTAL_HOST_RE.test(h)) return true;
  const own = ownHost();
  if (own && (h === own || h.endsWith(`.${own}`))) return true;
  return BLOCKED_DOMAINS.some((b) => h === b || h.endsWith(`.${b}`));
}

function allowedUrl(u: string): boolean {
  try {
    return Boolean(u) && !isBlockedHost(new URL(u).hostname);
  } catch {
    return false;
  }
}

const SEARCH_EXCLUSIONS = [`${PORTAL}.ae`, `${PORTAL}.com`, ownHost(), ...BLOCKED_DOMAINS]
  .filter(Boolean)
  .map((d) => `-site:${d}`)
  .join(" ");

export const CREDITS_PER_SCRAPE = 5;
export const MAX_SCRAPES_PER_ENTITY = 3;

export function isFirecrawlConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

export interface FirecrawlSource {
  url: string;
  title?: string;
  description?: string;
}

async function firecrawlPost<T>(path: string, body: unknown): Promise<T | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${FIRECRAWL_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
          console.warn(`[firecrawl] ${path} → ${res.status} (retry ${attempt})`);
          await sleep(1000 * attempt);
          continue;
        }
        console.warn(`[firecrawl] ${path} → ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (e) {
      // AbortError (timeout) is not worth retrying against the same slow URL.
      const msg = (e as Error).message;
      if ((e as Error).name === "AbortError" || attempt >= MAX_ATTEMPTS) {
        console.warn(`[firecrawl] ${path} failed:`, msg);
        return null;
      }
      console.warn(`[firecrawl] ${path} error (retry ${attempt}):`, msg);
      await sleep(1000 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function searchSources(
  query: string,
  limit = 3,
): Promise<FirecrawlSource[] | null> {
  const base = query.trim();
  if (!base) return null;
  const q = SEARCH_EXCLUSIONS ? `${base} ${SEARCH_EXCLUSIONS}` : base;

  type SearchResp = {
    success?: boolean;
    data?: { web?: Array<{ url?: string; title?: string; description?: string }> };
  };
  const json = await firecrawlPost<SearchResp>("/search", { query: q, limit });
  if (!json) return null;

  const rows = Array.isArray(json.data?.web) ? json.data!.web! : [];
  const sources = rows
    .filter(
      (r): r is { url: string; title?: string; description?: string } =>
        typeof r.url === "string" && allowedUrl(r.url),
    )
    .slice(0, limit)
    .map((r) => ({ url: r.url, title: r.title, description: r.description }));
  return sources.length > 0 ? sources : null;
}

async function scrapeJson(
  url: string,
  schema: Record<string, unknown>,
  prompt: string,
): Promise<Record<string, unknown> | null> {
  type ScrapeResp = { success?: boolean; data?: { json?: unknown } };
  const json = await firecrawlPost<ScrapeResp>("/scrape", {
    url,
    formats: [{ type: "json", prompt, schema }],
  });
  if (!json) return null;
  const data = json.data?.json;
  if (data == null || typeof data !== "object" || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

export interface ExtractResult {
  facts: Record<string, unknown> | null;
  scraped: string[];
}

export async function extractFacts(
  urls: string[],
  schema: Record<string, unknown>,
  prompt: string,
  opts: { deadline?: number } = {},
): Promise<ExtractResult> {
  const clean = urls.filter(allowedUrl).slice(0, MAX_SCRAPES_PER_ENTITY);
  const scraped: string[] = [];
  if (clean.length === 0) return { facts: null, scraped };

  const merged: Record<string, unknown> = {};
  let any = false;
  for (const url of clean) {
    if (opts.deadline != null && Date.now() >= opts.deadline) break;
    scraped.push(url);
    const facts = await scrapeJson(url, schema, prompt);
    if (!facts) continue;
    any = true;
    for (const [k, v] of Object.entries(facts)) {
      if (v == null || v === "") continue;
      const existing = merged[k];
      if (Array.isArray(v) && Array.isArray(existing)) {
        merged[k] = Array.from(
          new Set(
            [...existing, ...v].map((x) =>
              typeof x === "string" ? x : JSON.stringify(x),
            ),
          ),
        );
      } else if (existing == null || existing === "") {
        merged[k] = v;
      }
    }
  }
  return { facts: any ? merged : null, scraped };
}

export function pickBrochureUrl(
  sources: FirecrawlSource[],
  facts: Record<string, unknown> | null,
): string | undefined {
  const fromFacts =
    typeof facts?.brochureUrl === "string" ? facts.brochureUrl : undefined;
  if (fromFacts && !isJunkMediaUrl(fromFacts) && allowedUrl(fromFacts)) return fromFacts;

  for (const s of sources) {
    const u = s.url.toLowerCase();
    if (
      u.endsWith(".pdf") ||
      u.includes("brochure") ||
      u.includes("/download") ||
      u.includes("/media/")
    ) {
      return s.url;
    }
  }
  return undefined;
}

const IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i;
const IMAGE_REJECT_RE = /logo|icon|sprite|avatar|favicon|placeholder|thumb(?:nail)?|\/agent/i;

/**
 * Collect absolute, on-allowed-host image URLs the extractor found on official
 * developer pages. Rejects logos/icons/avatars and caps the list so a PDP gallery
 * stays reasonable.
 */
export function pickImages(
  facts: Record<string, unknown> | null,
  limit = 6,
): string[] {
  const raw = Array.isArray(facts?.imageUrls) ? facts!.imageUrls : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const u = item.trim();
    if (!u || seen.has(u)) continue;
    if (isJunkMediaUrl(u) || NEWS_HOST_RE.test(u)) continue;
    if (!allowedUrl(u)) continue;
    if (!IMAGE_EXT_RE.test(u)) continue;
    if (IMAGE_REJECT_RE.test(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= limit) break;
  }
  return out;
}

// Hosts we WANT for the PDP media embed even though some (youtube) are blocked
// as general scrape/image sources — an embeddable video/tour link is the goal.
const EMBED_MEDIA_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "player.vimeo.com",
  "matterport.com",
  "my.matterport.com",
  "kuula.co",
];

function isEmbedMediaUrl(u: string): boolean {
  try {
    const h = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return EMBED_MEDIA_HOSTS.some((b) => h === b || h.endsWith(`.${b}`));
  } catch {
    return false;
  }
}

// Placeholder/hallucinated URLs the extractor sometimes returns when it can't
// find a real link ("https://example.com/...", "your_virtual_tour_link_here").
const JUNK_HOSTS = new Set(["example.com", "example.org", "example.net", "test.com", "domain.com", "yourdomain.com", "localhost"]);
const JUNK_URL_RE =
  /placeholder|lorem|your[_-]?(?:video|image|tour|link|url|file|id)|video[_-]?id\b|_here\b|link[_-]?here|insert[_-]|xxx+/i;

/** True when the URL is an obvious placeholder / not a real, resolvable media link. */
export function isJunkMediaUrl(u: string): boolean {
  if (JUNK_URL_RE.test(u)) return true;
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return true;
    const h = url.hostname.toLowerCase().replace(/^www\./, "");
    if (JUNK_HOSTS.has(h) || h.endsWith(".example.com") || !h.includes(".")) return true;
    return false;
  } catch {
    return true; // unparseable → junk
  }
}

const MEDIA_TOKEN_STOPWORDS = new Set([
  "the", "and", "residence", "residences", "tower", "towers", "villas",
  "apartments", "dubai", "abu", "dhabi", "sharjah", "uae", "by", "at", "phase",
]);

/** Meaningful name/slug tokens for checking a scraped URL belongs to THIS project. */
export function projectUrlTokens(slugOrName: string): string[] {
  return slugOrName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !MEDIA_TOKEN_STOPWORDS.has(t));
}

function urlMentionsProject(url: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const u = url.toLowerCase();
  return tokens.some((t) => u.includes(t));
}

// News/press hosts — a "/video" page here is never the project's own video.
const NEWS_HOST_RE = /zawya|reuters|bloomberg|khaleejtimes|gulfnews|thenational|arabianbusiness|prnewswire/i;

export function pickVideoUrl(
  sources: FirecrawlSource[],
  facts: Record<string, unknown> | null,
  projectSlugOrName?: string,
): string | undefined {
  const tokens = projectSlugOrName ? projectUrlTokens(projectSlugOrName) : [];
  const fromFacts =
    typeof facts?.videoUrl === "string" ? facts.videoUrl : undefined;
  // Allow embeddable hosts (youtube/vimeo) here even though they're blocked as
  // scrape sources — a video link is exactly what the media section renders.
  if (fromFacts && !isJunkMediaUrl(fromFacts) && (allowedUrl(fromFacts) || isEmbedMediaUrl(fromFacts)))
    return fromFacts;

  // Source-URL fallback: only take a page that plausibly belongs to THIS
  // project (token overlap) and is not a news/press site — an unrelated
  // "/video" page (e.g. a Zawya news clip) is worse than no video at all.
  for (const s of sources) {
    const u = s.url.toLowerCase();
    if (isJunkMediaUrl(s.url) || NEWS_HOST_RE.test(u)) continue;
    if (!(u.includes("vimeo.com") || u.includes("/video"))) continue;
    if (urlMentionsProject(s.url, tokens)) return s.url;
  }
  return undefined;
}

const TOUR_URL_RE =
  /matterport\.com|kuula\.co|\/(?:360|virtual-tour|3d-tour|walkthrough)(?:[/?]|$)/i;

/** Matterport / 360 / virtual-tour link from official pages (embeddable or link-out). */
export function pickTourUrl(
  sources: FirecrawlSource[],
  facts: Record<string, unknown> | null,
): string | undefined {
  const fromFacts =
    typeof facts?.virtualTourUrl === "string" ? facts.virtualTourUrl : undefined;
  if (fromFacts && !isJunkMediaUrl(fromFacts) && (allowedUrl(fromFacts) || isEmbedMediaUrl(fromFacts)))
    return fromFacts;

  for (const s of sources) {
    if (TOUR_URL_RE.test(s.url) && !isJunkMediaUrl(s.url)) return s.url;
  }
  return undefined;
}