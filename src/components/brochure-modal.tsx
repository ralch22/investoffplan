"use client";

import { useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { isDownloadablePdfUrl } from "@/lib/brochure";
import { cn } from "@/lib/cn";
import { guardFormSubmit } from "@/lib/form-guard";

interface BrochureModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  brochureUrl?: string;
  whatsapp?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

function validate(name: string, phone: string): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = name.trim();
  const digits = phone.replace(/\D/g, "");

  if (!trimmedName) {
    errors.name = "Name is required";
  } else if (trimmedName.length < 2) {
    errors.name = "Enter your full name";
  }

  if (!digits) {
    errors.phone = "Phone number is required";
  } else if (digits.length < 8) {
    errors.phone = "Enter a valid phone number";
  }

  return errors;
}

export function BrochureModal({
  open,
  onClose,
  projectName,
  brochureUrl,
  whatsapp,
}: BrochureModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [guardError, setGuardError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const hasPdf = isDownloadablePdfUrl(brochureUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate(name, phone);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const guard = await guardFormSubmit({ honeypot, turnstileToken });
    setSubmitting(false);
    if (guard.bot) {
      setName("");
      setPhone("");
      setErrors({});
      onClose();
      return;
    }
    if (!guard.ok) {
      setGuardError(guard.error ?? "Unable to submit. Please try again.");
      return;
    }

    if (hasPdf) {
      window.open(brochureUrl, "_blank", "noopener,noreferrer");
    } else {
      const whatsappNumber = whatsapp ? whatsapp.replace(/\D/g, "") : "971508226002";
      const text = `Hi, I just requested the brochure for ${projectName} on invest off-plan. My name is ${name.trim()}. Phone: ${phone.trim()}. Please send it to me!`;
      // Analytics hook + UTM for WhatsApp brochure fallback CTA (GA4 ready)
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}&utm_source=investoffplan&utm_medium=brochure_modal&utm_campaign=whatsapp_fallback`;
      try {
        const w = window as any;
        if (w.gtag) {
          w.gtag("event", "brochure_request", { method: "whatsapp", project: projectName });
        }
        (w.dataLayer = w.dataLayer || []).push({
          event: "brochure_whatsapp_fallback",
          project_name: projectName,
        });
      } catch {}
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    setName("");
    setPhone("");
    setErrors({});
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brochure-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-elevation-lg"
      >
        <h2 id="brochure-modal-title" className="text-xl font-semibold text-text-dark">
          Download brochure
        </h2>
        <p className="mt-2 text-sm text-muted">
          {hasPdf
            ? `Get the official PDF for ${projectName}`
            : `A broker will send the brochure for ${projectName} via WhatsApp`}
        </p>

        <form onSubmit={handleSubmit} className="relative mt-6 space-y-4" noValidate>
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          <div>
            <label htmlFor="brochure-name" className="block text-sm font-medium text-text-dark">
              Full name
            </label>
            <input
              id="brochure-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "brochure-name-error" : undefined}
              className={cn("iop-input mt-1", errors.name && "iop-input-error")}
            />
            {errors.name ? (
              <p id="brochure-name-error" className="iop-field-error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="brochure-phone" className="block text-sm font-medium text-text-dark">
              Phone number
            </label>
            <input
              id="brochure-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "brochure-phone-error" : undefined}
              className={cn("iop-input mt-1", errors.phone && "iop-input-error")}
            />
            {errors.phone ? (
              <p id="brochure-phone-error" className="iop-field-error">
                {errors.phone}
              </p>
            ) : null}
          </div>

          <TurnstileField onToken={setTurnstileToken} action="brochure" />
          {guardError ? <p className="iop-field-error">{guardError}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="iop-btn-press w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting
              ? "Submitting…"
              : hasPdf
                ? "Download PDF brochure"
                : "Request brochure via WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}