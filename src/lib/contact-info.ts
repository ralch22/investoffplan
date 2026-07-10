/**
 * Canonical contact routing for invest off-plan.
 * WhatsApp leads route to Jad's numbers (set 2026-07-08); the office line
 * stays on the footer/contact pages for voice.
 */
export const WHATSAPP_PRIMARY = "971585276222";
export const WHATSAPP_SECONDARY = "971525893197";
export const WHATSAPP_PRIMARY_DISPLAY = "+971 58 527 6222";
export const WHATSAPP_SECONDARY_DISPLAY = "+971 52 589 3197";
export const OFFICE_PHONE_DISPLAY = "+971 44 321 620";
export const CONTACT_EMAIL = "info@investoffplan.com";

export function waHref(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
