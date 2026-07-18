"use client";

import { useEffect, useRef, useState } from "react";
import { HoneypotField } from "@/components/honeypot-field";
import { TurnstileField } from "@/components/turnstile-field";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitLead } from "@/lib/leads-client";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

/**
 * Floor-plan unlock gate.
 *
 * The first floor plan on a PDP is always public (trust + indexable content);
 * every further layout sits behind a one-time lead capture. The unlock is
 * site-wide and remembered per visitor — asking the same person twice would
 * only burn trust and duplicate their lead. The lead records WHICH project
 * triggered the unlock via projectSlug.
 */

const UNLOCK_STORAGE_KEY = "iop_fp_unlocked";

function readUnlocked(): boolean {
  try {
    return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useFloorPlanUnlock(): {
  unlocked: boolean;
  markUnlocked: () => void;
} {
  // SSR renders locked; the effect flips returning visitors after hydration.
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (readUnlocked()) setUnlocked(true);
  }, []);

  const markUnlocked = () => {
    setUnlocked(true);
    try {
      window.localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
    } catch {
      // Private mode etc. — session-only unlock is fine.
    }
  };

  return { unlocked, markUnlocked };
}

interface FormErrors {
  name?: string;
  phone?: string;
}

interface FloorPlanGateModalProps {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  projectName: string;
  projectSlug?: string;
  planCount: number;
}

export function FloorPlanGateModal({
  open,
  onClose,
  onUnlocked,
  projectName,
  projectSlug,
  planCount,
}: FloorPlanGateModalProps) {
  const { dict } = useI18n();
  const tf = dict.forms.floorPlans;
  const te = dict.forms.errors;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [guardError, setGuardError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (same pattern as BrochureModal).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, "");
    if (!trimmedName) next.name = te.nameRequired;
    else if (trimmedName.length < 2) next.name = te.fullNameShort;
    if (!digits) next.phone = te.phoneNumberRequired;
    else if (digits.length < 8) next.phone = te.phoneInvalid;
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitLead({
      formType: "floorplans",
      name: name.trim(),
      phone: phone.trim(),
      message: `Floor plan unlock: ${projectName}`,
      projectSlug,
      honeypot,
      turnstileToken,
      extra: { planCount: String(planCount) },
    });
    setSubmitting(false);
    if (result.bot) {
      // Honeypot tripped — pretend success to the bot, but do NOT unlock.
      setName("");
      setPhone("");
      setErrors({});
      onClose();
      return;
    }
    if (!result.ok) {
      setGuardError(result.error ?? te.submitFailed);
      // Token consumed/stale — reset the widget so the retry gets a fresh one.
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }

    trackEvent(ANALYTICS_EVENTS.FLOORPLANS_UNLOCK, {
      project_name: projectName,
      plan_count: planCount,
    });
    setName("");
    setPhone("");
    setErrors({});
    onUnlocked();
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="floorplan-gate-title"
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
            <h2 id="floorplan-gate-title" className="text-xl font-semibold text-text-dark">
              {tf.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {interpolate(tf.subtitle, { name: projectName })}
            </p>

            <form onSubmit={handleSubmit} className="relative mt-6 space-y-4" noValidate>
              <HoneypotField value={honeypot} onChange={setHoneypot} />
              <div>
                <label htmlFor="fp-gate-name" className="block text-sm font-medium text-text-dark">
                  {tf.fullNameLabel}
                </label>
                <input
                  id="fp-gate-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "fp-gate-name-error" : undefined}
                  className={cn("iop-input mt-1", errors.name && "iop-input-error")}
                />
                {errors.name ? (
                  <p id="fp-gate-name-error" role="alert" className="iop-field-error">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="fp-gate-phone" className="block text-sm font-medium text-text-dark">
                  {tf.phoneNumberLabel}
                </label>
                <input
                  id="fp-gate-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "fp-gate-phone-error" : undefined}
                  className={cn("iop-input mt-1", errors.phone && "iop-input-error")}
                />
                {errors.phone ? (
                  <p id="fp-gate-phone-error" role="alert" className="iop-field-error">
                    {errors.phone}
                  </p>
                ) : null}
              </div>

              <TurnstileField
                onToken={setTurnstileToken}
                action="floorplans"
                resetSignal={turnstileReset}
              />
              {guardError ? (
                <p role="alert" className="iop-field-error">
                  {guardError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="iop-btn-press focus-ring w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? dict.common.submitting : tf.submit}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
