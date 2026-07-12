"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { useI18n } from "@/i18n/locale-provider";
import type { Dict } from "@/i18n";

interface FormState {
  name: string;
  phone: string;
  email: string;
  whatsapp: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
}

function validate(values: FormState, t: Dict["footer"]["newsletter"]): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = t.nameRequired;
  const email = values.email.trim();
  if (!email) errors.email = t.emailRequired;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t.emailInvalid;
  return errors;
}

interface NewsletterFormProps {
  dark?: boolean;
}

export function NewsletterForm({ dark = false }: NewsletterFormProps) {
  const { dict } = useI18n();
  const t = dict.footer.newsletter;
  const [values, setValues] = useState<FormState>({ name: "", phone: "", email: "", whatsapp: false });
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
    const nextErrors = validate(values, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "newsletter",
      name: values.name.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim(),
      honeypot,
      turnstileToken,
      extra: { whatsappOptIn: values.whatsapp },
    });
    setSubmitting(false);
    if (result.bot) {
      setSubmitted(true);
      return;
    }
    if (!result.ok) {
      setGuardError(result.error ?? t.subscribeError);
      // The token was consumed (or stale) — reset the widget so the retry
      // submits a fresh one instead of 403ing forever.
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }

    setSubmitted(true);
  }

  const inputCls = cn(
    "h-12 w-full rounded-full border px-5 text-sm outline-none transition",
    dark
      ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20"
      : // input-border (#949494) meets WCAG 1.4.11 ≥3:1 against white (audit P6).
        "border-[var(--input-border)] bg-white text-text-dark placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
  );

  if (submitted) {
    return (
      <div
        role="status"
        className={cn(
          "mt-5 rounded-xl p-4 text-center text-sm",
          // brand-dark on brand/10 clears 4.5:1; plain brand on 12% red fill fails (audit P3).
          dark ? "bg-white/10 text-white/90" : "bg-brand/10 text-brand-dark",
        )}
      >
        {t.successPrefix}{" "}
        <span className="font-semibold">{values.email.trim()}</span>
        {t.successSuffix}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mt-5 space-y-3"
      noValidate
      aria-label={t.formAria}
    >
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            id="newsletter-name"
            type="text"
            placeholder={t.namePlaceholder}
            aria-label={t.nameLabel}
            autoComplete="name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "newsletter-name-error" : undefined}
            className={cn(inputCls, errors.name && "border-brand")}
          />
          {errors.name ? (
            <p id="newsletter-name-error" role="alert" className="iop-field-error px-2">
              {errors.name}
            </p>
          ) : null}
        </div>
        <input
          id="newsletter-phone"
          type="tel"
          placeholder={t.phonePlaceholder}
          aria-label={t.phoneLabel}
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <input
          id="newsletter-email"
          type="email"
          placeholder={t.emailPlaceholder}
          aria-label={t.emailLabel}
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "newsletter-email-error" : undefined}
          className={cn(inputCls, errors.email && "border-brand")}
        />
        {errors.email ? (
          <p id="newsletter-email-error" role="alert" className="iop-field-error px-2">
            {errors.email}
          </p>
        ) : null}
      </div>
      <label className={cn("flex cursor-pointer items-center gap-2 text-xs", dark ? "text-white/70" : "text-muted")}>
        <input
          type="checkbox"
          checked={values.whatsapp}
          onChange={(e) => updateField("whatsapp", e.target.checked)}
          className="h-4 w-4 rounded accent-brand"
        />
        {t.whatsappOptIn}
      </label>
      <TurnstileField onToken={setTurnstileToken} action="newsletter" resetSignal={turnstileReset} />
      {guardError ? (
        <p
          role="alert"
          className={cn("px-2 text-xs font-medium", dark ? "text-red-300" : "iop-field-error")}
        >
          {guardError}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="iop-btn-press inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? dict.common.submitting : dict.common.submit}
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 10h12M10 4l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}