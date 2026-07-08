"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";

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

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Name is required";
  const email = values.email.trim();
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
  return errors;
}

interface NewsletterFormProps {
  dark?: boolean;
}

export function NewsletterForm({ dark = false }: NewsletterFormProps) {
  const [values, setValues] = useState<FormState>({ name: "", phone: "", email: "", whatsapp: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [guardError, setGuardError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate(values);
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
      setGuardError(result.error ?? "Unable to subscribe. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  const inputCls = cn(
    "h-12 w-full rounded-full border px-5 text-sm outline-none transition",
    dark
      ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20"
      : "border-border bg-white text-text-dark placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
  );

  if (submitted) {
    return (
      <div className={cn("mt-5 rounded-xl p-4 text-center text-sm", dark ? "bg-white/10 text-white/90" : "bg-brand/10 text-brand")}>
        You&apos;re subscribed — we&apos;ll send launch alerts to{" "}
        <span className="font-semibold">{values.email.trim()}</span>.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mt-5 space-y-3"
      noValidate
      aria-label="Newsletter signup"
    >
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            placeholder="Name..."
            aria-label="Name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={cn(inputCls, errors.name && "border-red-400")}
          />
          {errors.name ? <p role="alert" className="iop-field-error px-2">{errors.name}</p> : null}
        </div>
        <input
          type="tel"
          placeholder="Phone..."
          aria-label="Phone"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email..."
          aria-label="Email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          className={cn(inputCls, errors.email && "border-red-400")}
        />
        {errors.email ? <p role="alert" className="iop-field-error px-2">{errors.email}</p> : null}
      </div>
      <label className={cn("flex cursor-pointer items-center gap-2 text-xs", dark ? "text-white/70" : "text-muted")}>
        <input
          type="checkbox"
          checked={values.whatsapp}
          onChange={(e) => updateField("whatsapp", e.target.checked)}
          className="h-4 w-4 rounded accent-brand"
        />
        Opt-in to receive WhatsApp exclusives
      </label>
      <TurnstileField onToken={setTurnstileToken} action="newsletter" />
      {guardError ? (
        <p className={cn("px-2 text-xs font-medium", dark ? "text-red-300" : "text-red-600")}>
          {guardError}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="iop-btn-press inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit"}
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 10h12M10 4l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}