export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AdvisorCard {
  slug: string;
  name: string;
  developer: string;
  area: string;
  imageUrl?: string;
  fromPriceAed?: number;
  handover?: string;
  /** Distinct bedroom counts (0 = studio). Format at render with bedsLabel(dict) (#332). */
  beds?: number[];
  paymentPlan?: string;
}

export type AdvisorCta = "none" | "lead-form" | "whatsapp";

export interface AdvisorResponse {
  reply: string;
  cards: AdvisorCard[];
  suggestions: string[];
  cta: AdvisorCta;
  /**
   * Optional A2UI messages for clients that opted in via `a2uiSupported`.
   * Additive and backward-compatible: `cards`/`cta` above are ALWAYS populated
   * so old bundles and the client-side error boundary keep working. Composed
   * only when the `ADVISOR_A2UI` server flag is on. See `./a2ui/composer.ts`.
   */
  a2ui?: import("./a2ui/messages").A2uiMessage[];
}

export interface AdvisorRequestBody {
  messages: AdvisorMessage[];
  locale?: "en" | "ar";
  /** Client renders the A2UI surface — gates whether the server composes it. */
  a2uiSupported?: boolean;
}
