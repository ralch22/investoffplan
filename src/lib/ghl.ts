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
  | { status: "sent"; contactId?: string; opportunityId?: string; opportunityError?: string }
  | { status: "skipped" }
  | { status: "failed"; error: string };

export function isGhlConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

interface GhlPipelineStage {
  id: string;
  name: string;
  position?: number;
}

interface GhlPipeline {
  id: string;
  name: string;
  stages: GhlPipelineStage[];
}

interface ResolvedPipeline {
  pipelineId: string;
  stageId: string;
}

// Resolved once per isolate — pipelines change rarely; a worker restart picks
// up changes. GHL_PIPELINE_ID / GHL_STAGE_ID env vars short-circuit discovery.
let cachedPipeline: ResolvedPipeline | null | undefined;

/**
 * Pick the pipeline + entry stage new website leads land in. Preference order:
 * explicit env IDs → pipeline whose name matches GHL_PIPELINE_NAME (default
 * "website") → first pipeline. Stage: name matching new/incoming/lead →
 * lowest-position stage. GHL's public API cannot CREATE pipelines (UI-only),
 * so discovery against whatever exists is the robust play.
 */
async function resolvePipeline(apiKey: string, locationId: string): Promise<ResolvedPipeline | null> {
  if (cachedPipeline !== undefined) return cachedPipeline;

  const envPipeline = process.env.GHL_PIPELINE_ID;
  const envStage = process.env.GHL_STAGE_ID;
  if (envPipeline && envStage) {
    cachedPipeline = { pipelineId: envPipeline, stageId: envStage };
    return cachedPipeline;
  }

  try {
    const res = await fetch(
      `${GHL_API_BASE}/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: GHL_API_VERSION,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) {
      cachedPipeline = null;
      return null;
    }
    const data = (await res.json()) as { pipelines?: GhlPipeline[] };
    const pipelines = data.pipelines ?? [];
    if (pipelines.length === 0) {
      cachedPipeline = null;
      return null;
    }

    // A pinned GHL_PIPELINE_ID (without a pinned stage) still wins — only the
    // stage is discovered. Falls through to name matching if the id is stale.
    const wanted = (process.env.GHL_PIPELINE_NAME ?? "website").toLowerCase();
    const pipeline =
      (envPipeline ? pipelines.find((p) => p.id === envPipeline) : undefined) ??
      pipelines.find((p) => p.name.toLowerCase().includes(wanted)) ??
      pipelines[0];

    const stages = [...(pipeline.stages ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    if (stages.length === 0) {
      cachedPipeline = null;
      return null;
    }
    const stage =
      stages.find((s) => /new|incoming|lead|enquir|inquir/i.test(s.name)) ?? stages[0];

    cachedPipeline = { pipelineId: pipeline.id, stageId: stage.id };
    return cachedPipeline;
  } catch {
    cachedPipeline = null;
    return null;
  }
}

function opportunityName(lead: GhlLeadInput): string {
  const who = lead.name?.trim() || lead.email || lead.phone || "Website lead";
  const what = lead.projectSlug ? ` — ${lead.projectSlug}` : "";
  return `${who}${what} (${lead.formType})`.slice(0, 120);
}

/** Stage the lead into the pipeline as an open opportunity. Best-effort. */
async function createOpportunity(
  apiKey: string,
  locationId: string,
  contactId: string,
  lead: GhlLeadInput,
  leadOwnerId?: string,
): Promise<{ opportunityId?: string; error?: string }> {
  const resolved = await resolvePipeline(apiKey, locationId);
  if (!resolved) {
    return { error: "no-pipeline: create one in GHL (UI) or set GHL_PIPELINE_ID/GHL_STAGE_ID" };
  }
  try {
    const res = await fetch(`${GHL_API_BASE}/opportunities/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        pipelineId: resolved.pipelineId,
        pipelineStageId: resolved.stageId,
        contactId,
        name: opportunityName(lead),
        status: "open",
        source: "investoffplan.com",
        // Opportunity owner = lead owner (Jad), so it shows assigned in the
        // pipeline and GHL notifies the assignee.
        ...(leadOwnerId ? { assignedTo: leadOwnerId } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { error: `GHL opp ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { opportunity?: { id?: string }; id?: string };
    return { opportunityId: data.opportunity?.id ?? data.id };
  } catch (error) {
    return { error: (error as Error).message.slice(0, 200) };
  }
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
  const leadOwnerId = process.env.GHL_LEAD_OWNER_ID;

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
        // Lead owner (e.g. Jad) so the contact is owned + GHL notifies the
        // assignee. No-op until GHL_LEAD_OWNER_ID (a GHL user id) is set.
        ...(leadOwnerId ? { assignedTo: leadOwnerId } : {}),
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

    // Stage the lead into the sales pipeline. Best-effort: an opportunity
    // failure must not fail the lead (contact + D1 row already exist) — but
    // it IS recorded so the retry cron can backfill it.
    let opportunityId: string | undefined;
    let opportunityError: string | undefined;
    if (contactId) {
      const opp = await createOpportunity(apiKey, locationId, contactId, lead, leadOwnerId);
      opportunityId = opp.opportunityId;
      opportunityError = opp.error;
    }

    return { status: "sent", contactId, opportunityId, opportunityError };
  } catch (error) {
    return { status: "failed", error: (error as Error).message.slice(0, 300) };
  }
}
