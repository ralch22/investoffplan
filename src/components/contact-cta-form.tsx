"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { withUtm } from "@/lib/utm";

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

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  const digits = values.phone.replace(/\D/g, "");

  if (!values.name.trim()) errors.name = "Name is required";
  if (!digits) errors.phone = "Phone is required";
  else if (digits.length < 8) errors.phone = "Enter a valid phone number";

  const email = values.email.trim();
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email";
  }

  if (!values.message.trim()) errors.message = "Tell us what you're looking for";

  return errors;
}

export function ContactCtaForm() {
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
    const nextErrors = validate(values);
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
      setGuardError(result.error ?? "Unable to submit. Please try again.");
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
        <p className="font-semibold text-white">Thanks — your enquiry is with our team.</p>
        <p className="mt-2 text-sm text-white/75">
          We&apos;ll reach out shortly. Prefer instant chat?{" "}
          <a
            href={withUtm("https://wa.me/971585276222", {
              medium: "whatsapp",
              content: "contact_form_success",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-light hover:text-white"
          >
            Message us on WhatsApp
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
          Send another enquiry
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
          placeholder="Name"
          aria-label="Name"
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
          placeholder="Phone"
          aria-label="Phone"
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
          placeholder="Email"
          aria-label="Email"
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
          placeholder="Country of residence"
          aria-label="Country of residence"
          autoComplete="country-name"
          value={values.country}
          onChange={(e) => updateField("country", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <textarea
          placeholder="What are you looking for?"
          aria-label="What are you looking for?"
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
            {submitting ? "Submitting…" : "Submit enquiry"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}