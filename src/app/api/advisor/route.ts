import { NextResponse } from "next/server";
import { runAdvisor } from "@/lib/advisor/loop";
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

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages — please slow down." },
      { status: 429 },
    );
  }

  const locale = body.locale === "ar" ? "ar" : "en";
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
