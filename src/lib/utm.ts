/**
 * Canonical UTM tagging for outbound CTAs (WhatsApp deep-links and brochure
 * PDFs). Every brochure / WhatsApp CTA appends a consistent UTM query so
 * downstream analytics (GA4) can attribute leads back to the exact placement.
 *
 * Keep the vocabulary small and stable:
 *   utm_source   — always "investoffplan"
 *   utm_medium   — the channel: "whatsapp" | "brochure"
 *   utm_campaign — always "cta" unless a caller overrides it
 *   utm_content  — the placement id, e.g. "pdp_hero", "contact_page"
 */
export const UTM_SOURCE = "investoffplan";

export type UtmMedium = "whatsapp" | "brochure";

export interface UtmParams {
  /** Channel the CTA opens. */
  medium: UtmMedium;
  /** Placement identifier, e.g. "pdp_mobile_bar", "developer_panel". */
  content: string;
  /** Defaults to "cta". */
  campaign?: string;
  /** Defaults to {@link UTM_SOURCE}. */
  source?: string;
}

/**
 * Append a consistent UTM query to a URL, preserving any existing query and
 * hash fragment. UTM params are appended (not merged) so an already-encoded
 * query — e.g. a WhatsApp `text=...` payload — is left byte-for-byte intact.
 */
export function withUtm(url: string, params: UtmParams): string {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);

  const utm = new URLSearchParams();
  utm.set("utm_source", params.source ?? UTM_SOURCE);
  utm.set("utm_medium", params.medium);
  utm.set("utm_campaign", params.campaign ?? "cta");
  utm.set("utm_content", params.content);

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${utm.toString()}${hash}`;
}
