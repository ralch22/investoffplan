import { isHoneypotTripped } from "@/lib/form-guard";

export interface LeadSubmission {
  formType:
    | "contact"
    | "contact-cta"
    | "brochure"
    | "floorplans"
    | "placements"
    | "newsletter"
    | "mortgage-preapproval"
    | "advisor";
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  projectSlug?: string;
  honeypot: string;
  turnstileToken: string;
  extra?: Record<string, unknown>;
  /** Injected internally from _ga cookie for server-side GA4 MP; callers should not set. */
  gaClientId?: string;
}

/** Extract GA4 client_id from the standard _ga cookie (format GA1.1.<cid> or GA1.2.<cid>). */
function getGaClientId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  try {
    const match = document.cookie.match(/_ga=([^;]+)/);
    if (!match) return undefined;
    const raw = decodeURIComponent(match[1]);
    // Typical: "GA1.1.1234567890.1234567890" -> client_id = "1234567890.1234567890"
    const parts = raw.split(".");
    if (parts.length >= 4) {
      return parts.slice(2).join(".");
    }
    if (parts.length === 3) {
      return parts.slice(1).join(".");
    }
    return raw || undefined;
  } catch {
    return undefined;
  }
}

export interface LeadResult {
  ok: boolean;
  bot?: boolean;
  error?: string;
}

/**
 * Single transport for every lead form: honeypot short-circuits silently,
 * everything else POSTs to /api/leads (Turnstile is verified server-side).
 */
export async function submitLead(lead: LeadSubmission): Promise<LeadResult> {
  if (isHoneypotTripped(lead.honeypot)) {
    return { ok: false, bot: true };
  }

  try {
    const gaClientId = getGaClientId();
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lead,
        gaClientId,
        pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? "Something went wrong. Please try again.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to send right now. Please try again." };
  }
}
