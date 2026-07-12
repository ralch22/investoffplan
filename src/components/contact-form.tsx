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
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  email?: string;
  subject?: string;
  message?: string;
}

interface ValidateMessages {
  emailRequired: string;
  emailInvalidAddress: string;
  subjectRequired: string;
  subjectShort: string;
  messageRequired: string;
  messageShort: string;
}

function validate(values: FormState, msg: ValidateMessages): FormErrors {
  const errors: FormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = msg.emailRequired;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = msg.emailInvalidAddress;
  }

  if (!values.subject.trim()) {
    errors.subject = msg.subjectRequired;
  } else if (values.subject.trim().length < 3) {
    errors.subject = msg.subjectShort;
  }

  if (!values.message.trim()) {
    errors.message = msg.messageRequired;
  } else if (values.message.trim().length < 10) {
    errors.message = msg.messageShort;
  }

  return errors;
}

export function ContactForm() {
  const { dict } = useI18n();
  const f = dict.forms.contact;
  const err = dict.forms.errors;

  const [values, setValues] = useState<FormState>({
    email: "",
    subject: "",
    message: "",
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
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate(values, {
      emailRequired: err.emailRequired,
      emailInvalidAddress: err.emailInvalidAddress,
      subjectRequired: err.subjectRequired,
      subjectShort: err.subjectShort,
      messageRequired: err.messageRequired,
      messageShort: err.messageShort,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "contact",
      email: values.email.trim(),
      message: `${values.subject.trim()}\n\n${values.message.trim()}`,
      honeypot,
      turnstileToken,
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

    trackEvent(ANALYTICS_EVENTS.CONTACT_SUBMIT, { form: "contact_page" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="mt-6 rounded-xl border border-border bg-surface-alt p-6 text-center"
      >
        <p className="font-semibold text-text-dark">{f.successTitle}</p>
        <p className="mt-2 text-sm text-muted">
          {f.successBody}
        </p>
        <button
          type="button"
          onClick={() => {
            // Turnstile tokens are single-use — a retained token 403s the
            // next submit with timeout-or-duplicate.
            setTurnstileToken("");
            setSubmitted(false);
          }}
          className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          {f.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 space-y-4" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-text-dark">
          {f.emailPlaceholder}
        </label>
        <input
          id="contact-email"
          type="email"
          placeholder={f.emailPlaceholder}
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={cn("iop-input", errors.email && "iop-input-error")}
        />
        {errors.email ? (
          <p id="contact-email-error" role="alert" className="iop-field-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-text-dark">
          {f.subjectPlaceholder}
        </label>
        <input
          id="contact-subject"
          type="text"
          placeholder={f.subjectPlaceholder}
          value={values.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={cn("iop-input", errors.subject && "iop-input-error")}
        />
        {errors.subject ? (
          <p id="contact-subject-error" role="alert" className="iop-field-error">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-text-dark">
          {f.messagePlaceholder}
        </label>
        <textarea
          id="contact-message"
          placeholder={f.messagePlaceholder}
          rows={6}
          value={values.message}
          onChange={(e) => updateField("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(
            "iop-input h-auto min-h-[9rem] resize-y py-3",
            errors.message && "iop-input-error",
          )}
        />
        {errors.message ? (
          <p id="contact-message-error" role="alert" className="iop-field-error">
            {errors.message}
          </p>
        ) : null}
      </div>

      <TurnstileField onToken={setTurnstileToken} action="contact" resetSignal={turnstileReset} />
      {guardError ? (
        <p role="alert" className="iop-field-error">
          {guardError}
        </p>
      ) : null}
      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? f.submitting : f.submit}
      </PrimaryButton>
    </form>
  );
}