/**
 * MCP tool registration for the investoffplan-mcp worker.
 *
 * Every tool is read-only and deterministic — D1 queries and pure functions,
 * never a model call — so this server has no spend class at all. The handlers
 * are thin: all real logic lives in the same libs the site itself renders from,
 * which is what keeps MCP answers incapable of disagreeing with the pages.
 *
 * The arg-normalisation helpers are exported separately so unit tests can pin
 * the caps and mappings without a D1 instance.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CatalogDatabase } from "../lib/db/client";
import {
  fetchProjectBySlug,
  fetchProjectsBySlugs,
  queryCatalogProjects,
} from "../lib/db/catalog-queries";
import { projectFacts, projectToCard } from "../lib/advisor/project-card";
import { getAreaStats, getDldSource, getDldTotals } from "../lib/dld-area-stats";
import { COMMUNITY_NICKNAME_ALIASES } from "../lib/community-nickname-aliases";
import {
  calculateMortgage,
  MAX_TERM_YEARS,
  MIN_DOWN_PAYMENT_PCT,
} from "../lib/mortgage";
import type { CitySlug, PaymentPlanFilter, Project } from "../lib/types";

export const SITE = "https://investoffplan.com";

/** Hard ceiling on search results per call — a page, not a dump. */
export const MAX_PAGE_SIZE = 20;

export function clampPageSize(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 8;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(n)));
}

/** Map MCP search args onto ProjectFilters — mirrors the advisor's proven mapping. */
export function toSearchQuery(args: {
  query?: string;
  city?: string;
  beds?: number;
  minPriceAed?: number;
  maxPriceAed?: number;
  developerSlug?: string;
  handoverBy?: number;
  pageSize?: number;
  page?: number;
}) {
  return {
    page: typeof args.page === "number" && args.page >= 1 ? Math.floor(args.page) : 1,
    pageSize: clampPageSize(args.pageSize),
    view: "project" as const,
    sort: "featured" as const,
    filters: {
      query: typeof args.query === "string" ? args.query : "",
      city: (typeof args.city === "string" ? args.city : "all") as CitySlug,
      beds: typeof args.beds === "number" ? args.beds : ("all" as const),
      minPrice: typeof args.minPriceAed === "number" ? args.minPriceAed : null,
      maxPrice: typeof args.maxPriceAed === "number" ? args.maxPriceAed : null,
      developer: typeof args.developerSlug === "string" ? args.developerSlug : "all",
      paymentPlan: "all" as PaymentPlanFilter,
      handoverBy: typeof args.handoverBy === "number" ? args.handoverBy : ("all" as const),
      amenities: [] as string[],
      propertyType: "all" as const,
    },
  };
}

/** Card + canonical URL — the only URL shape this server ever emits. */
export function cardWithUrl(project: Project) {
  return { ...projectToCard(project), url: `${SITE}/projects/${project.slug}` };
}

/**
 * Resolve an area query to DLD stats, accepting the marketing nicknames the
 * site's own routing accepts ("JVC", "JLT", …). The alias map stores catalog
 * SLUGS; de-slugifying gives a name areaKey() can normalise.
 */
export function resolveAreaStats(area: string) {
  const direct = getAreaStats(area);
  if (direct) return direct;
  const alias = COMMUNITY_NICKNAME_ALIASES[area.trim().toLowerCase().replace(/\s+/g, "-")];
  return alias ? getAreaStats(alias.replace(/-/g, " ")) : null;
}

export function mortgageInput(args: { priceAed: number; downPaymentPct?: number; termYears?: number }) {
  return {
    propertyPriceAed: args.priceAed,
    downPaymentPct: Math.max(MIN_DOWN_PAYMENT_PCT, Math.min(80, args.downPaymentPct ?? MIN_DOWN_PAYMENT_PCT)),
    annualRatePct: 4.25,
    termYears: Math.max(5, Math.min(MAX_TERM_YEARS, args.termYears ?? MAX_TERM_YEARS)),
    includeFees: true,
  };
}

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 1) }],
});

const err = (message: string) => ({
  content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
  isError: true,
});

const MORTGAGE_DISCLAIMER =
  "Illustrative only at 4.25% p.a. — not financial advice.";

/**
 * Build the per-request McpServer. Constructed per request (registration is
 * cheap, in-memory) so handlers close over this request's D1 binding.
 */
export function buildServer(db: CatalogDatabase | null, fetchOrigin: (path: string) => Promise<Response>) {
  const server = new McpServer({ name: "investoffplan-catalog", version: "1.0.0" });

  server.registerTool(
    "search_projects",
    {
      title: "Search off-plan projects",
      description:
        "Search the live invest off-plan catalog (1,700+ Dubai/UAE off-plan projects). Filter by free-text query, city slug, bedrooms (number, 0 = studio), min/max price in AED, developer slug, or latest handover year. Returns project cards with canonical URLs.",
      inputSchema: {
        query: z.string().max(120).optional(),
        city: z.string().max(60).optional(),
        beds: z.number().int().min(0).max(9).optional(),
        minPriceAed: z.number().min(0).optional(),
        maxPriceAed: z.number().min(0).optional(),
        developerSlug: z.string().max(80).optional(),
        handoverBy: z.number().int().min(2024).max(2040).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
      },
    },
    async (args) => {
      if (!db) return err("Catalog database unavailable.");
      const result = await queryCatalogProjects(db, toSearchQuery(args));
      if (!result || result.items.length === 0) {
        return json({ total: 0, projects: [], hint: "No matches — widen budget, beds or area." });
      }
      return json({
        total: result.meta.total,
        page: toSearchQuery(args).page,
        projects: result.items.map((item) => cardWithUrl(item.project as Project)),
      });
    },
  );

  server.registerTool(
    "get_project",
    {
      title: "Get one project",
      description:
        "Full facts for one off-plan project by its catalog slug: pricing, payment plan, handover, bedroom mix, developer and canonical URL.",
      inputSchema: { slug: z.string().min(1).max(120) },
    },
    async ({ slug }) => {
      if (!db) return err("Catalog database unavailable.");
      const project = await fetchProjectBySlug(db, slug);
      if (!project) return err(`No project with slug "${slug}".`);
      return json({ facts: projectFacts(project), card: cardWithUrl(project) });
    },
  );

  server.registerTool(
    "compare_projects",
    {
      title: "Compare two projects",
      description: "Side-by-side facts for exactly two projects, by catalog slug.",
      inputSchema: {
        slugA: z.string().min(1).max(120),
        slugB: z.string().min(1).max(120),
      },
    },
    async ({ slugA, slugB }) => {
      if (!db) return err("Catalog database unavailable.");
      if (slugA === slugB) return err("Provide two different slugs.");
      const projects = await fetchProjectsBySlugs(db, [slugA, slugB]);
      const a = projects.find((p) => p.slug === slugA);
      const b = projects.find((p) => p.slug === slugB);
      if (!a || !b) {
        return err(`Not found: ${[!a && slugA, !b && slugB].filter(Boolean).join(", ")}.`);
      }
      return json({
        a: { facts: projectFacts(a), card: cardWithUrl(a) },
        b: { facts: projectFacts(b), card: cardWithUrl(b) },
        compareUrl: `${SITE}/compare`,
      });
    },
  );

  server.registerTool(
    "market_stats",
    {
      title: "Dubai market statistics for an area",
      description:
        "Anonymized Dubai Land Department market statistics for a community/area by NAME (e.g. 'Jumeirah Village Circle'): median sold price, AED/sqft, per-bedroom medians, gross rental yield and sample sizes. Statistics below an 8-transaction sample or with implausible yields are withheld, never invented.",
      inputSchema: { area: z.string().min(2).max(80) },
    },
    async ({ area }) => {
      const stats = resolveAreaStats(area);
      if (!stats) {
        return err(
          `No published DLD statistics for "${area}" — either the name didn't match a DLD community or the sample is below the publication floor.`,
        );
      }
      return json({ ...getDldSource(), totals: getDldTotals(), area: stats, marketPages: `${SITE}/sold-prices` });
    },
  );

  server.registerTool(
    "mortgage_estimate",
    {
      title: "Mortgage estimate (UAE norms)",
      description:
        "Deterministic mortgage estimate for a property price in AED: monthly payment, down payment, DLD + fixed fees, cash to close and a +2% stress test. UAE norms: minimum 20% down, maximum 25-year term. " +
        MORTGAGE_DISCLAIMER,
      inputSchema: {
        priceAed: z.number().min(100_000).max(500_000_000),
        // Any value accepted; clamped to the UAE 20% floor and echoed back —
        // an out-of-norm ask gets a corrected estimate, not a protocol error.
        downPaymentPct: z.number().min(0).max(100).optional(),
        termYears: z.number().int().min(1).max(50).optional(),
      },
    },
    async (args) => {
      const input = mortgageInput(args);
      return json({ input, result: calculateMortgage(input), note: MORTGAGE_DISCLAIMER });
    },
  );

  // The two discovery documents, as first-class MCP resources. Served by
  // fetching our own origin so they can never drift from what crawlers see.
  server.registerResource(
    "llms",
    `${SITE}/llms.txt`,
    { title: "Site description for agents", mimeType: "text/plain" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/plain", text: await (await fetchOrigin("/llms.txt")).text() }],
    }),
  );
  server.registerResource(
    "llms-full",
    `${SITE}/llms-full.txt`,
    { title: "Full data companion (DLD market data + project index)", mimeType: "text/plain" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/plain", text: await (await fetchOrigin("/llms-full.txt")).text() }],
    }),
  );

  return server;
}
