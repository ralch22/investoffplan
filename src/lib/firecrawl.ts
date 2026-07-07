import { SITE_URL } from "./site-url";

const FIRECRAWL_BASE = (
  process.env.FIRECRAWL_API_BASE || "https://api.firecrawl.dev/v2"
).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;
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
      console.warn(`[firecrawl] ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[firecrawl] ${path} failed:`, (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  if (fromFacts && allowedUrl(fromFacts)) return fromFacts;

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

export function pickVideoUrl(
  sources: FirecrawlSource[],
  facts: Record<string, unknown> | null,
): string | undefined {
  const fromFacts =
    typeof facts?.videoUrl === "string" ? facts.videoUrl : undefined;
  if (fromFacts && allowedUrl(fromFacts)) return fromFacts;

  for (const s of sources) {
    const u = s.url.toLowerCase();
    if (u.includes("vimeo.com") || u.includes("/video")) return s.url;
  }
  return undefined;
}