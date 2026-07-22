"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { submitLead } from "@/lib/leads-client";
import { TurnstileField } from "@/components/turnstile-field";
import { useAdvisorA2ui } from "./context";

/**
 * A2UI `LeadForm` leaf. Self-contained callback form that submits straight to
 * the existing `/api/leads` endpoint (Turnstile intact) — a client-only side
 * effect that never re-enters the LLM loop. On success it notifies the widget
 * via `onLeadSubmitted` so the chat can append its thanks message and hide the
 * form, mirroring the legacy inline form's behaviour.
 */
export function AdvisorLeadForm({ lastQuestion }: { lastQuestion?: string }) {
  const { dict } = useI18n();
  const t = dict.advisor;
  const { leadDone, onLeadSubmitted } = useAdvisorA2ui();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [tokenReset, setTokenReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (leadDone) return null;

  async function send() {
    if (!name.trim() || phone.replace(/\D/g, "").length < 8) {
      setError(t.leadInvalid);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await submitLead({
        formType: "advisor",
        name: name.trim(),
        phone: phone.trim(),
        message: `Advisor callback request. Last question: ${lastQuestion ?? ""}`.slice(
          0,
          500,
        ),
        honeypot: "",
        turnstileToken: token,
      });
      if (result.ok) {
        onLeadSubmitted();
      } else {
        setError(t.leadError);
        // Token consumed/stale — reset so the retry gets a fresh one.
        setToken("");
        setTokenReset((n) => n + 1);
      }
    } catch {
      setError(t.leadError);
      setToken("");
      setTokenReset((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-text-dark">{t.leadTitle}</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.leadName}
        aria-label={t.leadName}
        autoComplete="name"
        className="iop-input h-11 text-sm"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.leadPhone}
        aria-label={t.leadPhone}
        autoComplete="tel"
        type="tel"
        className="iop-input h-11 text-sm"
      />
      <TurnstileField
        onToken={setToken}
        action="advisor-callback"
        resetSignal={tokenReset}
      />
      {error ? (
        <p className="text-xs font-medium text-brand" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="iop-btn-press focus-ring w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? t.leadSending : t.leadSubmit}
      </button>
    </div>
  );
}
