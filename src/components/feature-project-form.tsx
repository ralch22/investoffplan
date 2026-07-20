"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { useI18n } from "@/i18n/locale-provider";

interface FormState {
  company: string;
  name: string;
  email: string;
  phone: string;
  project: string;
  message: string;
}

interface FormErrors {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function FeatureProjectForm() {
  const { dict } = useI18n();
  const t = dict.featureProject.form;
  const err = dict.forms.errors;

  const [values, setValues] = useState<FormState>({
    company: "",
    name: "",
    email: "",
    phone: "",
    project: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [guardError, setGuardError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.company.trim()) e.company = t.companyRequired;
    if (!values.name.trim()) e.name = err.nameRequired;
    const email = values.email.trim();
    if (!email) e.email = err.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = err.emailInvalid;
    const digits = values.phone.replace(/\D/g, "");
    if (digits && digits.length < 8) e.phone = err.phoneInvalid;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGuardError("");
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Company + project-of-interest ride in the message so they surface in the
    // owner alert email (which prints message + project). Extra keeps them
    // structured on the lead row too.
    const detail = [
      `Company: ${values.company.trim()}`,
      values.project.trim() ? `Project/developer: ${values.project.trim()}` : null,
      values.message.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");
    const result = await submitLead({
      formType: "placements",
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      message: detail,
      honeypot,
      turnstileToken,
      extra: { company: values.company.trim(), project: values.project.trim() || undefined },
    });
    setSubmitting(false);
    if (result.bot) {
      setSubmitted(true);
      return;
    }
    if (!result.ok) {
      setGuardError(result.error ?? err.submitFailed);
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }
    trackEvent(ANALYTICS_EVENTS.CONTACT_SUBMIT, { form: "feature_project" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-surface-alt p-6 text-center"
      >
        <p className="font-semibold text-text-dark">{t.successTitle}</p>
        <p className="mt-2 text-sm text-muted">{t.successBody}</p>
      </div>
    );
  }

  const field = "iop-input mt-1";
  const labelCls = "block text-sm font-medium text-text-dark";

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fp-company" className={labelCls}>{t.company}</label>
          <input
            id="fp-company"
            autoComplete="organization"
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            aria-invalid={Boolean(errors.company)}
            className={cn(field, errors.company && "iop-input-error")}
          />
          {errors.company ? <p role="alert" className="iop-field-error">{errors.company}</p> : null}
        </div>
        <div>
          <label htmlFor="fp-name" className={labelCls}>{t.name}</label>
          <input
            id="fp-name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={cn(field, errors.name && "iop-input-error")}
          />
          {errors.name ? <p role="alert" className="iop-field-error">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="fp-email" className={labelCls}>{t.email}</label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={cn(field, errors.email && "iop-input-error")}
          />
          {errors.email ? <p role="alert" className="iop-field-error">{errors.email}</p> : null}
        </div>
        <div>
          <label htmlFor="fp-phone" className={labelCls}>{t.phone}</label>
          <input
            id="fp-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            className={cn(field, errors.phone && "iop-input-error")}
          />
          {errors.phone ? <p role="alert" className="iop-field-error">{errors.phone}</p> : null}
        </div>
      </div>
      <div>
        <label htmlFor="fp-project" className={labelCls}>{t.project}</label>
        <input
          id="fp-project"
          value={values.project}
          onChange={(e) => update("project", e.target.value)}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="fp-message" className={labelCls}>{t.message}</label>
        <textarea
          id="fp-message"
          rows={4}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          className={cn(field, "resize-y")}
        />
      </div>
      <TurnstileField onToken={setTurnstileToken} action="placements" resetSignal={turnstileReset} />
      {guardError ? <p role="alert" className="iop-field-error">{guardError}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="iop-btn-press focus-ring w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? dict.common.submitting : t.submit}
      </button>
      <p className="text-center text-xs text-muted-light">{t.disclaimer}</p>
    </form>
  );
}
