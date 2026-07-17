/**
 * Advisor function-calling tool schemas. Pure data, ZERO runtime imports — so
 * it is safe to import from a unit test (tools.ts pulls the DB/catalog chain,
 * which is server-only and cannot load under the test runner).
 *
 * Workers AI migrated the Llama function-calling backend to vLLM
 * (OpenAI-compatible) around 2026-07, which requires each tool wrapped as
 * { type: "function", function: {...} }; the old flat shape now fails
 * validation with `body.tools.0.function: Field required` and — because the
 * advisor route catches AI errors into the WhatsApp fallback — took the advisor
 * silently offline with every response still a clean 200. TOOL_DEFINITIONS
 * applies the wrapper; the model's RESPONSE still comes back flat
 * ({ name, arguments }), so the loop and executeTool are unchanged.
 */

interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "search_knowledge",
    description:
      "Search the invest off-plan knowledge base (project details, area guides, buying process, mortgages, FAQ, news). Use for any factual question about projects, areas, or how buying off-plan works.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        folder: {
          type: "string",
          enum: ["projects", "areas", "faq", "guides", "news", "collections", "site"],
          description: "Optional folder to restrict the search",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_projects",
    description:
      "Search live off-plan project inventory with structured filters. Use when the user wants projects matching criteria (city, bedrooms, budget, developer, payment plan, handover year). Returns real projects with prices.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          enum: ["all", "dubai", "abu-dhabi", "sharjah", "rak", "umm-al-quwain", "al-ain"],
        },
        beds: { type: "number", description: "Bedrooms (0 = studio)" },
        maxPriceAed: { type: "number" },
        minPriceAed: { type: "number" },
        developerSlug: { type: "string", description: "Kebab-case developer slug, e.g. emaar-properties" },
        paymentPlan: { type: "string", enum: ["all", "post-handover", "multiple"] },
        handoverBy: { type: "number", description: "Latest acceptable handover year" },
        query: { type: "string", description: "Free-text (project/area name)" },
      },
    },
  },
  {
    name: "get_project",
    description: "Get full details of one project by its slug.",
    parameters: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "mortgage_estimate",
    description:
      "Estimate a UAE mortgage: monthly payment, cash to close incl. DLD fee. Use when the user asks about financing a specific price.",
    parameters: {
      type: "object",
      properties: {
        propertyPriceAed: { type: "number" },
        downPaymentPct: { type: "number", description: "Default 20" },
        termYears: { type: "number", description: "Default 25" },
      },
      required: ["propertyPriceAed"],
    },
  },
  {
    name: "request_callback",
    description:
      "Offer the user a callback / WhatsApp handoff with our team. Use when they want to speak to someone, reserve a unit, get a brochure sent, or ask something requiring a human.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Short reason for the handoff" },
      },
    },
  },
];

/** OpenAI/vLLM-wrapped tool schemas passed to ai.run — see the module note. */
export const TOOL_DEFINITIONS = TOOL_SCHEMAS.map((t) => ({
  type: "function" as const,
  function: t,
}));
