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
}

export interface AdvisorRequestBody {
  messages: AdvisorMessage[];
  locale?: "en" | "ar";
}
