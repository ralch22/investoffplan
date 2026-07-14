/**
 * Trust content gate — VERIFIED CLAIMS ONLY.
 *
 * This file is the single source of truth for testimonials, licensing, and
 * team content. The arrays below ship EMPTY on purpose: every trust component
 * (`src/components/trust/*`) renders nothing when its content array is empty,
 * so fabricated testimonials, invented license numbers, or fictional team
 * members can never reach production. Populating this file is a human
 * decision, not an AI one.
 *
 * To unlock a component, Rami adds real, consented content here (see
 * docs/trust-content-needed.md for the checklist) — the component then
 * renders automatically on its next build. Do NOT add placeholder or
 * illustrative entries; an empty section is better than a fake one.
 */

export interface Testimonial {
  /** Verbatim client quote — written consent required before adding. */
  quote: string;
  name: string;
  /** e.g. "Bought a 1BR in JVC, 2025" — keep it factual. */
  context?: string;
  source?: "google" | "direct";
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  photoUrl?: string;
}

/** Real, consented client quotes only. Rami provides these. */
export const TESTIMONIALS: Testimonial[] = [];

/** Real RERA ORN / DED license numbers only — never invented.
 * Source: official documents ingested 2026-07-11 (DED Commercial License +
 * RERA Office Registration card). Public broker-disclosure facts only. */
export const LICENSE: { orn?: string; ded?: string; label?: string } = {};

/** Real people with real bios and consent to be listed. */
export const TEAM: TeamMember[] = [];
