"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { withUtm } from "@/lib/utm";
import { useI18n } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";

interface FormState {
  name: string;
  phone: string;
  email: string;
  country: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

interface ValidateMessages {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  messageWhatLooking: string;
}

function validate(values: FormState, msg: ValidateMessages): FormErrors {
  const errors: FormErrors = {};
  const digits = values.phone.replace(/\D/g, "");

  if (!values.name.trim()) errors.name = msg.nameRequired;
  if (!digits) errors.phone = msg.phoneRequired;
  else if (digits.length < 8) errors.phone = msg.phoneInvalid;

  const email = values.email.trim();
  if (!email) errors.email = msg.emailRequired;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = msg.emailInvalid;
  }

  if (!values.message.trim()) errors.message = msg.messageWhatLooking;

  return errors;
}

export function ContactCtaForm({ locale = "en" }: { locale?: Locale }) {
  const { dict } = useI18n();
  const f = dict.forms.contactCta;
  const err = dict.forms.errors;

  const [values, setValues] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    country: "",
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
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
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
      messageWhatLooking: err.messageWhatLooking,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "contact-cta",
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      country: values.country.trim() || undefined,
      message: values.message.trim(),
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

    trackEvent(ANALYTICS_EVENTS.CONTACT_SUBMIT, { form: "contact_cta" });
    setSubmitted(true);
  }

  const inputClass =
    "h-12 w-full rounded-full border-0 bg-white/10 px-5 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/40";

  if (submitted) {
    return (
      <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
        <p className="font-semibold text-white">{f.successTitle}</p>
        <p className="mt-2 text-sm text-white/75">
          {f.successBody}{" "}
          <a
            href={withUtm("https://wa.me/971585276222", {
              medium: "whatsapp",
              content: "contact_form_success",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-light hover:text-white"
          >
            {f.whatsappCta}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            // Turnstile tokens are single-use — a retained token 403s the
            // next submit with timeout-or-duplicate.
            setTurnstileToken("");
            setSubmitted(false);
          }}
          className="mt-4 text-sm font-semibold text-brand-light hover:text-white"
        >
          {f.sendAnotherEnquiry}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div>
        <input
          type="text"
          placeholder={f.namePlaceholder}
          aria-label={f.namePlaceholder}
          autoComplete="name"
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={cn(inputClass, errors.name && "ring-2 ring-brand")}
        />
        {errors.name ? (
          <p className="mt-1 px-2 text-xs text-brand-light">{errors.name}</p>
        ) : null}
      </div>
      <div>
        <input
          type="tel"
          placeholder={f.phonePlaceholder}
          aria-label={f.phonePlaceholder}
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className={cn(inputClass, errors.phone && "ring-2 ring-brand")}
        />
        {errors.phone ? (
          <p className="mt-1 px-2 text-xs text-brand-light">{errors.phone}</p>
        ) : null}
      </div>
      <div>
        <input
          type="email"
          placeholder={f.emailPlaceholder}
          aria-label={f.emailPlaceholder}
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          className={cn(inputClass, errors.email && "ring-2 ring-brand")}
        />
        {errors.email ? (
          <p className="mt-1 px-2 text-xs text-brand-light">{errors.email}</p>
        ) : null}
      </div>
      <div>
        <input
          type="text"
          placeholder={f.countryPlaceholder}
          aria-label={f.countryPlaceholder}
          autoComplete="country-name"
          value={values.country}
          onChange={(e) => updateField("country", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <textarea
          placeholder={f.messagePlaceholder}
          aria-label={f.messagePlaceholder}
          rows={4}
          value={values.message}
          onChange={(e) => updateField("message", e.target.value)}
          className={cn(
            "w-full rounded-2xl border-0 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/40",
            errors.message && "ring-2 ring-brand",
          )}
        />
        {errors.message ? (
          <p className="mt-1 px-2 text-xs text-brand-light">{errors.message}</p>
        ) : null}
      </div>
      <div className="space-y-3 sm:col-span-2">
        <TurnstileField onToken={setTurnstileToken} action="contact-cta" resetSignal={turnstileReset} />
        {guardError ? <p className="px-2 text-xs text-brand-light">{guardError}</p> : null}
        <div className="flex justify-end">
          <PrimaryButton type="submit" showArrow={false} disabled={submitting}>
            {submitting ? f.submitting : f.submit}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}