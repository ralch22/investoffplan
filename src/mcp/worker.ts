/**
 * investoffplan-mcp — read-only MCP server over the catalog (streamable HTTP).
 *
 * A separate deployable from the same repo (wrangler.mcp.jsonc), routed at
 * investoffplan.com/mcp* and www.…/mcp* — carved out of the main worker's
 * routes by longest-match. Stateless: no Durable Objects, no sessions worth
 * persisting — every tool is a deterministic D1 query or pure function, and
 * NO tool ever calls a model, so this server has no spend class.
 *
 * Guardrail order per request: per-IP rate limit (Cloudflare binding) → global
 * daily counter (shared D1 `daily_counters`, key `mcp:<date>` — namespaced away
 * from the advisor's `advisor:<date>`) → MCP handler.
 */
import { sql } from "drizzle-orm";
import { createMcpHandler } from "agents/mcp";
import { createDb } from "../lib/db/client";
import { dailyCounters } from "../lib/db/schema";
import { buildServer, SITE } from "./tools";

interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  DB: D1Database;
  MCP_RATE_LIMIT?: RateLimitBinding;
  MCP_DAILY_CAP?: string;
}

/**
 * Same atomic UPSERT as the advisor's budget counter (src/lib/advisor/budget.ts),
 * re-based on createDb + worker env. Fail-open: the belt must never be the outage.
 */
async function withinDailyCap(env: Env): Promise<boolean> {
  const cap = Number(env.MCP_DAILY_CAP ?? 5000);
  if (!Number.isFinite(cap) || cap <= 0) return true;
  try {
    const db = createDb(env.DB);
    const key = `mcp:${new Date().toISOString().slice(0, 10)}`;
    const now = new Date().toISOString();
    const row = await db
      .insert(dailyCounters)
      .values({ key, count: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: dailyCounters.key,
        set: { count: sql`${dailyCounters.count} + 1`, updatedAt: now },
      })
      .returning({ count: dailyCounters.count })
      .get();
    return (row?.count ?? 0) <= cap;
  } catch (error) {
    console.error("[mcp] daily counter failed — allowing request", error);
    return true;
  }
}

const reject = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight and protocol negotiation belong to the transport; only
    // POSTs (actual JSON-RPC calls) pay the guardrail toll.
    if (request.method === "POST") {
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      try {
        const gate = await env.MCP_RATE_LIMIT?.limit({ key: ip });
        if (gate && !gate.success) {
          return reject(429, "Rate limited — max 20 requests/minute. Slow down and retry.");
        }
      } catch {
        // Binding absent (local dev) or transient failure — never the outage.
      }
      if (!(await withinDailyCap(env))) {
        return reject(503, "Daily request cap reached — try again tomorrow.");
      }
    }

    // Per-request server: handlers close over THIS request's D1 binding, and
    // registration is cheap in-memory work. fetchOrigin serves the llms
    // resources from the same zone so they can never drift from the site.
    const server = buildServer(
      env.DB ? createDb(env.DB) : null,
      (path: string) => fetch(`${SITE}${path}`),
    );
    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
