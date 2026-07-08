/**
 * Server-side GA4 Measurement Protocol client for generate_lead conversions.
 * Used to record every lead captured via /api/leads (D1 + GHL) as a GA4 event.
 * Survives client-side ad blockers / cookie consent blocks.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const MEASUREMENT_ID = "G-7GDZWYG4N2";
const ENDPOINT = "https://www.google-analytics.com/mp/collect";

export interface Ga4GenerateLeadInput {
  formType: string;
  projectSlug?: string;
  /** GA client_id extracted from _ga cookie on client; falls back to random UUID */
  clientId?: string;
}

/**
 * Fire a non-blocking generate_lead event via GA4 MP.
 * Safe to call from waitUntil; never throws to caller.
 * Skips silently if GA4_MP_SECRET is not configured.
 */
export async function sendGa4GenerateLead(input: Ga4GenerateLeadInput): Promise<void> {
  const apiSecret = process.env.GA4_MP_SECRET;
  if (!apiSecret) {
    return;
  }

  const clientId = input.clientId && input.clientId.trim()
    ? input.clientId.trim()
    : crypto.randomUUID();

  const params: Record<string, string | number | boolean | undefined> = {
    form_type: input.formType,
  };
  if (input.projectSlug) {
    params.project_slug = input.projectSlug;
  }

  const payload = {
    client_id: clientId,
    events: [
      {
        name: "generate_lead",
        params,
      },
    ],
  };

  try {
    const url = `${ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${encodeURIComponent(apiSecret)}`;
    // Fire and forget — do not await response body; any network failure is ignored.
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow all errors — GA4 reporting must never impact lead capture.
  }
}
