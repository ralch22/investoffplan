import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { isHoneypotTripped } from "@/lib/form-guard";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";
import { forwardLeadToGhl } from "@/lib/ghl";
import { getPlacementLeadBoost } from "@/lib/placements";
import { sendGa4GenerateLead } from "@/lib/ga4-mp";

export const dynamic = "force-dynamic";

const FORM_TYPES = new Set([
  "contact",
  "contact-cta",
  "brochure",
  "newsletter",
  "mortgage-preapproval",
  "advisor",
]);

interface LeadBody {
  formType?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  projectSlug?: string;
  pagePath?: string;
  honeypot?: string;
  turnstileToken?: string;
  extra?: Record<string, unknown>;
  gaClientId?: string;
}

const clean = (v: unknown, max = 500): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
};

export async function POST(request: Request) {
  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Bots get a silent success.
  if (isHoneypotTripped(body.honeypot ?? "")) {
    return NextResponse.json({ ok: true });
  }

  const formType = clean(body.formType, 40) ?? "";
  if (!FORM_TYPES.has(formType)) {
    return NextResponse.json({ ok: false, error: "Unknown form type" }, { status: 400 });
  }

  const email = clean(body.email, 200);
  const phone = clean(body.phone, 50);
  const name = clean(body.name, 200);
  if (!email && !phone) {
    return NextResponse.json(
      { ok: false, error: "An email or phone number is required" },
      { status: 400 },
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  // Enforce only when the server can actually verify (TURNSTILE_SECRET_KEY
  // present, i.e. deployed workers). Without the secret, verifyTurnstileToken
  // passes any non-empty string — rejecting empty tokens there is security
  // theater that only breaks local/e2e, where the domain-locked widget can't
  // issue tokens at all.
  if (isTurnstileEnabled() && process.env.TURNSTILE_SECRET_KEY) {
    const token = clean(body.turnstileToken, 4000) ?? "";
    const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
    const verify = token
      ? await verifyTurnstileToken(token, remoteIp)
      : { success: false as const };
    if (!verify.success) {
      return NextResponse.json(
        { ok: false, error: "Security verification failed. Please try again." },
        { status: 403 },
      );
    }
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Lead store unavailable" },
      { status: 503 },
    );
  }

  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    formType,
    name: name ?? null,
    email: email ?? null,
    phone: phone ?? null,
    country: clean(body.country, 100) ?? null,
    message: clean(body.message, 2000) ?? null,
    projectSlug: clean(body.projectSlug, 200) ?? null,
    pagePath: clean(body.pagePath, 300) ?? null,
    payload: body.extra ? JSON.stringify(body.extra).slice(0, 4000) : null,
    turnstileOk: isTurnstileEnabled(),
    ghlStatus: "pending",
    ghlAttempts: 0,
  };

  await db.insert(leads).values(lead);

  const forwardGhl = async () => {
    // Paid-placement lead tagging: a lead against a project holding an active
    // placement (lead_priority >= 1) gets the premium tags + "[FEATURED] "
    // opportunity prefix. Same helper as /api/leads/retry so retried leads
    // are tagged identically. Returns null (no-op) on any error.
    const boost = await getPlacementLeadBoost(lead.projectSlug);
    const result = await forwardLeadToGhl({
      formType,
      name,
      email,
      phone,
      message: lead.message ?? undefined,
      projectSlug: lead.projectSlug ?? undefined,
      pagePath: lead.pagePath ?? undefined,
      extraTags: boost?.extraTags,
      opportunityNamePrefix: boost?.opportunityNamePrefix,
    });
    await db
      .update(leads)
      .set({
        ghlStatus: result.status,
        ghlAttempts: 1,
        ghlContactId: result.status === "sent" ? (result.contactId ?? null) : null,
        ghlOpportunityId:
          result.status === "sent" ? (result.opportunityId ?? null) : null,
        ghlLastError:
          result.status === "failed"
            ? result.error
            : result.status === "sent"
              ? (result.opportunityError ?? null)
              : null,
      })
      .where(eq(leads.id, lead.id));
  };

  const sendGa4 = async () => {
    // Only fire GA4 MP if the user has explicitly consented (iop_consent=granted
    // cookie set by the CookieConsentBanner). Firing without consent would process
    // the GA4 client ID server-side without a lawful basis (GDPR/UAE PDPL).
    const consentCookie = request.headers.get("cookie") ?? "";
    if (!consentCookie.includes("iop_consent=granted")) return;
    // Extract client id if provided by client (from _ga cookie); server falls back inside.
    const clientIdFromBody = clean(body.gaClientId as string | undefined, 50);
    await sendGa4GenerateLead({
      formType,
      projectSlug: lead.projectSlug ?? undefined,
      clientId: clientIdFromBody,
    });
    // Never throws outward; GA4 errors are swallowed inside sendGa4GenerateLead.
  };

  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(forwardGhl());
    ctx.waitUntil(sendGa4());
  } catch {
    // Not on Workers (e.g. next start in e2e) — forward inline, best effort.
    await forwardGhl().catch(() => {});
    await sendGa4().catch(() => {});
  }

  return NextResponse.json({ ok: true, id: lead.id });
}
