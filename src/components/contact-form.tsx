"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";

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

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.subject.trim()) {
    errors.subject = "Subject is required";
  } else if (values.subject.trim().length < 3) {
    errors.subject = "Subject must be at least 3 characters";
  }

  if (!values.message.trim()) {
    errors.message = "Message is required";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormState>({
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
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
    const nextErrors = validate(values);
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
      setGuardError(result.error ?? "Unable to submit. Please try again.");
      return;
    }

    trackEvent(ANALYTICS_EVENTS.CONTACT_SUBMIT, { form: "contact_page" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface-alt p-6 text-center">
        <p className="font-semibold text-text-dark">Thanks — your message has been sent.</p>
        <p className="mt-2 text-sm text-muted">
          Our team will get back to you shortly. You can also email iop@investoffplan.com
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
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 space-y-4" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div>
        <input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={cn("iop-input", errors.email && "iop-input-error")}
        />
        {errors.email ? (
          <p id="contact-email-error" className="iop-field-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <input
          type="text"
          placeholder="Subject"
          aria-label="Subject"
          value={values.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={cn("iop-input", errors.subject && "iop-input-error")}
        />
        {errors.subject ? (
          <p id="contact-subject-error" className="iop-field-error">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <textarea
          placeholder="Message"
          aria-label="Message"
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
          <p id="contact-message-error" className="iop-field-error">
            {errors.message}
          </p>
        ) : null}
      </div>

      <TurnstileField onToken={setTurnstileToken} action="contact" />
      {guardError ? <p className="iop-field-error">{guardError}</p> : null}
      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </PrimaryButton>
    </form>
  );
}