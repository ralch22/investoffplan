import { isHoneypotTripped } from "@/lib/form-guard";

export interface LeadSubmission {
  formType: "contact" | "contact-cta" | "brochure" | "newsletter" | "mortgage-preapproval";
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  projectSlug?: string;
  honeypot: string;
  turnstileToken: string;
  extra?: Record<string, unknown>;
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
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lead,
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
