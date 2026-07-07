"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { cn } from "@/lib/cn";
import { guardFormSubmit } from "@/lib/form-guard";

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
    const guard = await guardFormSubmit({ honeypot, turnstileToken });
    setSubmitting(false);
    if (guard.bot) {
      setSubmitted(true);
      return;
    }
    if (!guard.ok) {
      setGuardError(guard.error ?? "Unable to submit. Please try again.");
      return;
    }

    const text = [
      "New enquiry from invest off-plan",
      `Name: ${values.name.trim()}`,
      `Phone: ${values.phone.trim()}`,
      `Email: ${values.email.trim()}`,
      values.country.trim() ? `Country: ${values.country.trim()}` : null,
      "",
      values.message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/97144397620?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSubmitted(true);
  }

  const inputClass =
    "h-12 w-full rounded-full border-0 bg-white/10 px-5 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/40";

  if (submitted) {
    return (
      <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
        <p className="font-semibold text-white">Thanks — we&apos;ve opened WhatsApp for you.</p>
        <p className="mt-2 text-sm text-white/75">
          Send the pre-filled message to reach our team directly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-semibold text-brand-light hover:text-white"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-6 grid gap-3 sm:grid-cols-2" noValidate>
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div>
        <input
          type="text"
          placeholder="Name"
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
          value={values.country}
          onChange={(e) => updateField("country", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <textarea
          placeholder="What are you looking for?"
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
        <TurnstileField onToken={setTurnstileToken} action="contact-cta" />
        {guardError ? <p className="px-2 text-xs text-brand-light">{guardError}</p> : null}
        <div className="flex justify-end">
          <PrimaryButton type="submit" showArrow={false} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit via WhatsApp"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}