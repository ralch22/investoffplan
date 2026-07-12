"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { useI18n } from "@/i18n/locale-provider";

interface FormState {
  name: string;
  phone: string;
  email: string;
  budget: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

interface ValidateMessages {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailRequired: string;
  emailInvalid: string;
}

function validate(values: FormState, msg: ValidateMessages): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = msg.nameRequired;
  const digits = values.phone.replace(/\D/g, "");
  if (!digits) errors.phone = msg.phoneRequired;
  else if (digits.length < 8) errors.phone = msg.phoneInvalid;
  const email = values.email.trim();
  if (!email) errors.email = msg.emailRequired;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = msg.emailInvalid;
  }
  return errors;
}

export function MortgagePreapprovalForm() {
  const { dict } = useI18n();
  const f = dict.forms.preapproval;
  const err = dict.forms.errors;

  const BUDGET_BANDS = [f.budgetUnder1m, f.budget1to2m, f.budget2to5m, f.budget5mPlus];

  const [values, setValues] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    budget: BUDGET_BANDS[1],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [guardError, setGuardError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate(values, {
      nameRequired: err.nameRequired,
      phoneRequired: err.phoneRequired,
      phoneInvalid: err.phoneInvalid,
      emailRequired: err.emailRequired,
      emailInvalid: err.emailInvalid,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "mortgage-preapproval",
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      message: `Mortgage pre-approval request — budget: ${values.budget}`,
      honeypot,
      turnstileToken,
      extra: { budget: values.budget },
    });
    setSubmitting(false);
    if (result.bot) {
      setSubmitted(true);
      return;
    }
    if (!result.ok) {
      setGuardError(result.error ?? err.submitFailed);
      // The token was consumed (or stale) — reset the widget so the retry
      // submits a fresh one instead of 403ing forever.
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }

    trackEvent(ANALYTICS_EVENTS.CONTACT_SUBMIT, { form: "mortgage_preapproval" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-surface-alt p-6 text-center">
        <p className="font-semibold text-text-dark">{f.successTitle}</p>
        <p className="mt-2 text-sm text-muted">{f.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <input
            type="text"
            placeholder={f.namePlaceholder}
            aria-label={f.namePlaceholder}
            autoComplete="name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={cn("iop-input", errors.name && "iop-input-error")}
          />
          {errors.name ? <p className="iop-field-error">{errors.name}</p> : null}
        </div>
        <div>
          <input
            type="tel"
            placeholder={f.phonePlaceholder}
            aria-label={f.phonePlaceholder}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            className={cn("iop-input", errors.phone && "iop-input-error")}
          />
          {errors.phone ? <p className="iop-field-error">{errors.phone}</p> : null}
        </div>
      </div>
      <div>
        <input
          type="email"
          placeholder={f.emailPlaceholder}
          aria-label={f.emailPlaceholder}
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          className={cn("iop-input", errors.email && "iop-input-error")}
        />
        {errors.email ? <p className="iop-field-error">{errors.email}</p> : null}
      </div>
      <label className="block text-sm font-semibold text-text-dark">
        {f.budgetLabel}
        <select
          value={values.budget}
          onChange={(e) => updateField("budget", e.target.value)}
          className="iop-input mt-1"
        >
          {BUDGET_BANDS.map((band) => (
            <option key={band} value={band}>
              {band}
            </option>
          ))}
        </select>
      </label>
      <TurnstileField onToken={setTurnstileToken} action="mortgage-preapproval" resetSignal={turnstileReset} />
      {guardError ? <p className="iop-field-error">{guardError}</p> : null}
      <PrimaryButton type="submit" disabled={submitting} className="w-full">
        {submitting ? dict.common.submitting : f.cta}
      </PrimaryButton>
      <p className="text-center text-xs text-muted">{f.disclaimer}</p>
    </form>
  );
}
