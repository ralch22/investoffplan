"use client";

import { useEffect, useRef, useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { isDownloadablePdfUrl } from "@/lib/brochure";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { WHATSAPP_SECONDARY } from "@/lib/contact-info";
import { withUtm } from "@/lib/utm";

interface BrochureModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectSlug?: string;
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
  projectSlug,
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (a11y audit O1).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const hasPdf = isDownloadablePdfUrl(brochureUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate(name, phone);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "brochure",
      name: name.trim(),
      phone: phone.trim(),
      message: `Brochure request: ${projectName}`,
      projectSlug,
      honeypot,
      turnstileToken,
      extra: { delivery: hasPdf ? "pdf" : "whatsapp" },
    });
    setSubmitting(false);
    if (result.bot) {
      setName("");
      setPhone("");
      setErrors({});
      onClose();
      return;
    }
    if (!result.ok) {
      setGuardError(result.error ?? "Unable to submit. Please try again.");
      return;
    }

    trackEvent(ANALYTICS_EVENTS.BROCHURE_OPEN, {
      project_name: projectName,
      delivery: hasPdf ? "pdf" : "whatsapp",
    });

    if (hasPdf) {
      // Deep-link the brochure PDF with consistent UTM tagging.
      const pdfUrl = withUtm(brochureUrl!, {
        medium: "brochure",
        content: "brochure_modal_pdf",
      });
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      const whatsappNumber = whatsapp ? whatsapp.replace(/\D/g, "") : WHATSAPP_SECONDARY;
      const text = `Hi, I just requested the brochure for ${projectName} on invest off-plan. My name is ${name.trim()}. Phone: ${phone.trim()}. Please send it to me!`;
      // Analytics hook + consistent UTM for WhatsApp brochure fallback CTA (GA4 ready)
      const waUrl = withUtm(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
        { medium: "whatsapp", content: "brochure_modal_fallback" },
      );
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
    <dialog
      ref={dialogRef}
      aria-labelledby="brochure-modal-title"
      onClose={handleClose}
      className="fixed inset-0 z-[var(--z-modal)] m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {open ? (
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-elevation-lg">
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
      ) : null}
    </dialog>
  );
}