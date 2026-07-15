import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runAdvisor } from "@/lib/advisor/loop";
import { consumeAdvisorBudget } from "@/lib/advisor/budget";
import { WHATSAPP_PRIMARY_DISPLAY } from "@/lib/contact-info";
import type { AdvisorRequestBody, AdvisorResponse } from "@/lib/advisor/types";

export const dynamic = "force-dynamic";

// Best-effort per-isolate rate limit (Ask-Aqua pattern: cap bursts, not users).
const WINDOW_MS = 5 * 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

// Cloudflare Rate Limiting binding (wrangler `ratelimits`); per-colo but
// native and zero-latency. Layered: binding → in-memory Map → daily budget.
type RateLimitBinding = { limit(opts: { key: string }): Promise<{ success: boolean }> };

async function boundRateLimited(ip: string): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const limiter = (env as { ADVISOR_RATE_LIMIT?: RateLimitBinding }).ADVISOR_RATE_LIMIT;
    if (!limiter) return false;
    const { success } = await limiter.limit({ key: ip });
    return !success;
  } catch {
    return false; // not on Workers (next start / e2e) — binding absent
  }
}

export async function POST(request: Request) {
  let body: AdvisorRequestBody;
  try {
    body = (await request.json()) as AdvisorRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !String(last.content).trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if ((await boundRateLimited(ip)) || rateLimited(ip)) {
    return NextResponse.json(
      {
        error:
          locale === "ar"
            ? "رسائل كثيرة — انتظر دقيقة من فضلك."
            : "Too many messages — please wait a minute.",
      },
      { status: 429 },
    );
  }

  // Site-wide daily Workers-AI budget: when exhausted, degrade to the human
  // channel with a friendly 200 (the widget renders the WhatsApp CTA), never
  // an error screen.
  if (!(await consumeAdvisorBudget())) {
    const capped: AdvisorResponse = {
      reply:
        locale === "ar"
          ? `المستشار وصل إلى حده اليومي — تواصل معنا مباشرة عبر واتساب ${WHATSAPP_PRIMARY_DISPLAY}.`
          : `The advisor has reached today's capacity — reach our team directly on WhatsApp ${WHATSAPP_PRIMARY_DISPLAY}.`,
      cards: [],
      suggestions: [],
      cta: "whatsapp",
    };
    return NextResponse.json(capped);
  }

  try {
    const response = await runAdvisor(messages, locale);
    return NextResponse.json(response);
  } catch {
    // Any AI failure degrades to the human channel — never a 500 to the widget.
    const fallback: AdvisorResponse = {
      reply:
        locale === "ar"
          ? `المستشار غير متاح حالياً — تواصل معنا مباشرة عبر واتساب ${WHATSAPP_PRIMARY_DISPLAY}.`
          : `The advisor is offline right now — reach our team directly on WhatsApp ${WHATSAPP_PRIMARY_DISPLAY}.`,
      cards: [],
      suggestions: [],
      cta: "whatsapp",
    };
    return NextResponse.json(fallback);
  }
}
