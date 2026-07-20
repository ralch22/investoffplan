/**
 * Lead-notification automation — fires on every accepted lead, independent of
 * the GHL forward (which handles CRM + pipeline + WhatsApp nurture). Two sends,
 * both best-effort via Resend:
 *   1. instant owner alert to the monitored team mailbox (all sources), and
 *   2. an auto-acknowledgement to the lead (high-intent sources that gave an
 *      email).
 * Source-agnostic by design: a new formType picks up a default label and the
 * default (no-ack) policy automatically, so adding a lead source never needs a
 * change here — only an entry in the maps below if you want tailored copy.
 */

import { sendEmail } from "@/lib/email/resend";
import { leadAckEmail, leadNotificationEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

/** Human-readable source label per formType. Unknown types fall back to a
 * title-cased version of the raw type, so nothing is ever unlabelled. */
const SOURCE_LABELS: Record<string, string> = {
  contact: "Contact form",
  "contact-cta": "Contact CTA",
  brochure: "Brochure request",
  floorplans: "Floor-plan unlock",
  "mortgage-preapproval": "Mortgage pre-approval",
  placements: "Placement enquiry",
  newsletter: "Newsletter signup",
  advisor: "AI advisor lead",
};

/** Sources whose leads receive an auto-acknowledgement email (when an email is
 * present). Newsletter has its own opt-in flow; advisor is a chat context. */
const ACK_FORM_TYPES = new Set([
  "contact",
  "contact-cta",
  "brochure",
  "floorplans",
  "mortgage-preapproval",
]);

export function leadSourceLabel(formType: string): string {
  return (
    SOURCE_LABELS[formType] ??
    formType.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function shouldAckLead(formType: string, hasEmail: boolean): boolean {
  return hasEmail && ACK_FORM_TYPES.has(formType);
}

/** Turn a project slug into a readable name without a catalog lookup — this is
 * the slug reformatted, not a fabricated fact. */
export function projectNameFromSlug(slug?: string): string | undefined {
  if (!slug) return undefined;
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface NotifyLeadInput {
  formType: string;
  name?: string;
  email?: string;
  phone?: string;
  projectSlug?: string;
  pagePath?: string;
  message?: string;
}

function ownerInbox(): string {
  return process.env.LEAD_NOTIFY_EMAIL || "iop@investoffplan.com";
}

/**
 * Send the owner alert + (conditional) lead acknowledgement. Never throws:
 * each send is independently best-effort and already logged to email_log by
 * sendEmail. Returns nothing — the caller fires it via ctx.waitUntil.
 */
export async function notifyLead(input: NotifyLeadInput): Promise<void> {
  const sourceLabel = leadSourceLabel(input.formType);
  const locale = input.pagePath?.startsWith("/ar") ? "ar" : "en";
  const teamInbox = ownerInbox();

  // 1. Owner alert — reply-to the lead's email so a reply reaches the prospect.
  const owner = leadNotificationEmail({
    sourceLabel,
    name: input.name,
    email: input.email,
    phone: input.phone,
    projectSlug: input.projectSlug,
    pagePath: input.pagePath,
    message: input.message,
    siteUrl: getSiteUrl(),
  });
  await sendEmail({
    to: teamInbox,
    subject: owner.subject,
    html: owner.html,
    kind: "lead-notify",
    ...(input.email ? { replyTo: input.email } : {}),
  }).catch(() => {});

  // 2. Lead acknowledgement — only high-intent, email-bearing leads.
  if (input.email && shouldAckLead(input.formType, true)) {
    const ack = leadAckEmail({
      name: input.name,
      projectName: projectNameFromSlug(input.projectSlug),
      locale,
    });
    await sendEmail({
      to: input.email,
      subject: ack.subject,
      html: ack.html,
      kind: "lead-ack",
      replyTo: teamInbox,
    }).catch(() => {});
  }
}
