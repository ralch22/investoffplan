import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  WHATSAPP_PRIMARY_DISPLAY,
  OFFICE_PHONE_DISPLAY,
} from "@/lib/contact-info";
import { executeTool, TOOL_DEFINITIONS, type ToolContext } from "./tools";
import type { AdvisorCard, AdvisorMessage, AdvisorResponse } from "./types";

// @cf/meta/llama-3.1-8b-instruct was deprecated 2026-05-30 (Workers AI error
// 5028) — it took the advisor silently offline (the route caught the error and
// served the WhatsApp fallback as a clean 200). Successor: same 8b class, so
// the daily neuron budget and latency profile are unchanged, and it returns
// the flat { name, arguments } tool_calls shape the loop below reads directly
// (verified against the live account 2026-07-17; the 70b/scout alternatives
// cost ~10x or return the OpenAI-nested shape this loop doesn't parse).
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_STEPS = 4;
const MAX_HISTORY = 6;

const SYSTEM_PROMPT = `You are the Off-Plan Advisor for invest off-plan (investoffplan.com), a UAE off-plan property intelligence platform run by Aria Properties LLC, a licensed Dubai brokerage (DRN 20678).

Voice: expert, warm, concise, investor-focused. UK English. Reply in the user's language (including Arabic).

HARD RULES:
- You are an expert in Dubai real estate. Confidently answer general questions about buying off-plan, market trends, fees, or areas using your own knowledge and the search_knowledge tool.
- For SPECIFIC project availability, prices, payment plans, or handover dates, you MUST use the search_projects or get_project tools. If a tool returned no matching data, say you don't have that specific information and offer the team's help.
- NEVER promise or predict returns, appreciation, or guaranteed outcomes. NEVER give personal financial advice — mortgage numbers are illustrative only.
- Do not discuss specific projects that are not in the catalog; say we don't track them.
- Keep replies under 130 words. Use short paragraphs or compact lists.
- When you show projects (search_projects/get_project), reference them by name — the chat renders cards for them automatically. Do not repeat prices already visible on cards unless asked.
- If the user wants a human, a brochure sent, a viewing, or to reserve: use request_callback. WhatsApp ${WHATSAPP_PRIMARY_DISPLAY} and phone ${OFFICE_PHONE_DISPLAY} (Sun-Thu 9:00-18:00 Dubai) are always available.
- Nudge gently toward one clear next step (view a project, compare, calculate a mortgage, or leave contact details). Never be pushy.`;

interface AiRunResult {
  response?: string;
  tool_calls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

interface AiBinding {
  run(model: string, options: Record<string, unknown>): Promise<AiRunResult>;
}

function buildSuggestions(cards: AdvisorCard[], hadCallback: boolean): string[] {
  const out: string[] = [];
  const first = cards[0];
  if (first) {
    out.push(`What payment plan does ${first.name} offer?`);
    if (cards.length > 1) out.push(`Compare ${first.name} with ${cards[1].name}`);
    if (first.fromPriceAed)
      out.push(`Monthly mortgage for AED ${first.fromPriceAed.toLocaleString("en-US")}?`);
  } else {
    out.push("Show me 2-beds under AED 2M in Dubai");
    out.push("Which areas have the most launches?");
    out.push("How does buying off-plan work?");
  }
  if (!hadCallback) out.push("Ask the team to call me");
  return out.slice(0, 4);
}

export async function runAdvisor(
  messages: AdvisorMessage[],
  locale: "en" | "ar",
): Promise<AdvisorResponse> {
  let ai: AiBinding | undefined;
  let searchBinding: ToolContext["searchBinding"] | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bag = env as unknown as Record<string, unknown>;
    ai = bag.AI as AiBinding | undefined;
    searchBinding = bag.ADVISOR_SEARCH as ToolContext["searchBinding"] | undefined;
  } catch {
    // No Workers context (plain `next start` in e2e) — fall through to offline reply.
  }

  if (!ai) {
    return {
      reply:
        locale === "ar"
          ? `المستشار غير متاح حالياً — تواصل معنا مباشرة عبر واتساب ${WHATSAPP_PRIMARY_DISPLAY}.`
          : `The advisor is offline right now — reach our team directly on WhatsApp ${WHATSAPP_PRIMARY_DISPLAY}.`,
      cards: [],
      suggestions: [],
      cta: "whatsapp",
    };
  }

  const ctx: ToolContext = { searchBinding, cardIndex: new Map() };
  const history = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: String(m.content).slice(0, 1500),
  }));

  const convo: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  let reply = "";
  let cta: AdvisorResponse["cta"] = "none";
  const toolsUsed: string[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const result = await ai.run(MODEL, {
      messages: convo,
      tools: TOOL_DEFINITIONS,
      max_tokens: 600,
    });

    const toolCalls = result.tool_calls ?? [];
    if (toolCalls.length === 0) {
      reply = (result.response ?? "").trim();
      break;
    }

    for (const call of toolCalls.slice(0, 3)) {
      toolsUsed.push(call.name);
      if (call.name === "request_callback") cta = "lead-form";
      const toolResult = await executeTool(ctx, call.name, call.arguments ?? {});
      convo.push({
        role: "assistant",
        content: `[called ${call.name}(${JSON.stringify(call.arguments ?? {}).slice(0, 200)})]`,
      });
      convo.push({ role: "tool", name: call.name, content: toolResult });
    }
  }

  if (!reply) {
    // Loop exhausted on tool calls — force a final answer from context.
    const final = await ai.run(MODEL, {
      messages: [
        ...convo,
        {
          role: "system",
          content: "Answer the user now using ONLY the tool results above.",
        },
      ],
      max_tokens: 500,
    });
    reply = (final.response ?? "").trim();
  }

  const cards = [...ctx.cardIndex.values()].slice(0, 4);

  // Structured session insight (Workers observability), Ask-Aqua pattern.
  console.log(
    JSON.stringify({
      advisor_session: {
        locale,
        turn: history.length,
        toolsUsed,
        nCards: cards.length,
        cta,
      },
    }),
  );

  return {
    reply:
      reply ||
      (locale === "ar"
        ? "عذراً، لم أفهم — هل يمكنك إعادة الصياغة؟"
        : "Sorry, I didn't catch that — could you rephrase?"),
    cards,
    suggestions: buildSuggestions(cards, cta === "lead-form"),
    cta,
  };
}
