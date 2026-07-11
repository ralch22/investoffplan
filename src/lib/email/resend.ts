/**
 * Resend transactional email sending.
 * Mirrors the GHL pattern (src/lib/ghl.ts): degrades gracefully to "skipped"
 * when RESEND_API_KEY is not configured on the worker, and NEVER throws to
 * callers. Every attempt (sent / skipped / failed) is logged to email_log —
 * best-effort, so a missing D1 context (e.g. build time) never breaks sending.
 */

import { emailLog } from "@/lib/db/schema";
import { getDb } from "@/lib/db/client";

const RESEND_API_BASE = "https://api.resend.com";
const DEFAULT_FROM = "invest off-plan <noreply@investoffplan.com>";
const SEND_TIMEOUT_MS = 10_000;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  kind: "magic-link" | "alert" | "welcome" | "test";
  userId?: string;
  savedSearchId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  status: "sent" | "skipped" | "failed";
  resendId?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Best-effort email_log write. Swallows all DB errors — there is no D1
 * context at build time and a logging failure must never fail (or throw
 * from) a send.
 */
async function logEmail(
  input: SendEmailInput,
  status: "sent" | "skipped" | "failed",
  resendId?: string,
  error?: string,
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(emailLog).values({
      id: crypto.randomUUID(),
      userId: input.userId ?? null,
      email: input.to,
      kind: input.kind,
      savedSearchId: input.savedSearchId ?? null,
      resendId: resendId ?? null,
      status,
      error: error ?? null,
      payload: JSON.stringify({ subject: input.subject }),
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Best-effort only.
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logEmail(input, "skipped");
    return { ok: false, status: "skipped" };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `Resend ${res.status}: ${body.slice(0, 300)}`;
      await logEmail(input, "failed", undefined, error);
      return { ok: false, status: "failed", error };
    }

    const data = (await res.json()) as { id?: string };
    await logEmail(input, "sent", data.id);
    return { ok: true, status: "sent", resendId: data.id };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Resend timeout after ${SEND_TIMEOUT_MS}ms`
        : (error as Error).message.slice(0, 300);
    await logEmail(input, "failed", undefined, message);
    return { ok: false, status: "failed", error: message };
  } finally {
    clearTimeout(timeout);
  }
}
