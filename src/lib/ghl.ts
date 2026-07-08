/**
 * GoHighLevel (LeadConnector) forwarding for captured leads.
 * Leads are always stored in D1 first; forwarding degrades gracefully to
 * "skipped" when GHL secrets are not configured on the worker.
 */

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export interface GhlLeadInput {
  formType: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  projectSlug?: string;
  pagePath?: string;
}

export type GhlForwardResult =
  | { status: "sent"; contactId?: string }
  | { status: "skipped" }
  | { status: "failed"; error: string };

export function isGhlConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

function splitName(name?: string): { firstName?: string; lastName?: string } {
  const trimmed = name?.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export async function forwardLeadToGhl(lead: GhlLeadInput): Promise<GhlForwardResult> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) {
    return { status: "skipped" };
  }

  const { firstName, lastName } = splitName(lead.name);
  const notes: string[] = [];
  if (lead.message) notes.push(lead.message);
  if (lead.projectSlug) notes.push(`Project: ${lead.projectSlug}`);
  if (lead.pagePath) notes.push(`Page: ${lead.pagePath}`);

  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(lead.email ? { email: lead.email } : {}),
        ...(lead.phone ? { phone: lead.phone } : {}),
        source: "investoffplan.com",
        tags: ["investoffplan", `iop-${lead.formType}`],
        ...(notes.length
          ? { customFields: [{ key: "iop_last_inquiry", field_value: notes.join(" | ") }] }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { status: "failed", error: `GHL ${res.status}: ${body.slice(0, 300)}` };
    }

    const data = (await res.json()) as { contact?: { id?: string } };
    const contactId = data.contact?.id;

    const workflowId = process.env.GHL_WORKFLOW_ID;
    if (workflowId && contactId) {
      // Best effort — a workflow failure must not fail the lead.
      await fetch(`${GHL_API_BASE}/contacts/${contactId}/workflow/${workflowId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: GHL_API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }).catch(() => {});
    }

    return { status: "sent", contactId };
  } catch (error) {
    return { status: "failed", error: (error as Error).message.slice(0, 300) };
  }
}
