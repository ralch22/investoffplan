"use client";

import { useEffect, useRef, useState } from "react";
import { TurnstileField } from "@/components/turnstile-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { signIn } from "@/lib/auth/client";
import { verifyTurnstileClient } from "@/lib/form-guard";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";
import type { GateContext } from "@/components/auth/sign-in-modal-bus";

// Google button only renders when the PUBLIC flag is on — NEXT_PUBLIC_* is
// baked at build time, so this must be flipped together with the server-side
// GOOGLE_CLIENT_ID/SECRET pair (docs/auth-setup.md).
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  /** Gate context that opened the modal — swaps in contextual subtitle copy. */
  context?: GateContext | null;
}

export function SignInModal({ open, onClose, context }: SignInModalProps) {
  const { locale, dict } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Native <dialog>.showModal() gives focus trap, Escape, and focus restore
  // for free (house pattern — see mobile-nav.tsx).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const callbackURL = localePath(locale, "/account");

  const gateSubtitle = context
    ? {
        "compare-slot": dict.auth.gateCompare,
        "pdf-export": dict.auth.gatePdf,
        "save-search": dict.auth.gateSaveSearch,
        "deep-analytics": dict.auth.gateDeepAnalytics,
      }[context]
    : null;
  const subtitle = gateSubtitle ?? dict.auth.modalSubtitle;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setErrorMessage(dict.auth.invalidEmail);
      return;
    }

    setStatus("sending");
    const guard = await verifyTurnstileClient(turnstileToken);
    if (!guard.ok) {
      setStatus("error");
      setErrorMessage(guard.error ?? dict.auth.error);
      // Turnstile tokens are single-use — clearing state is not enough, the
      // widget itself must reset before it will issue a fresh token.
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }

    const { error } = await signIn.magicLink({ email: trimmed, callbackURL });
    if (error) {
      setStatus("error");
      setErrorMessage(dict.auth.error);
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
      return;
    }
    setStatus("sent");
  }

  function handleGoogle() {
    void signIn.social({ provider: "google", callbackURL });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sign-in-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-[var(--z-overlay)] m-auto w-[min(calc(100%-2rem),26rem)] rounded-2xl bg-transparent p-0 backdrop:bg-surface-darker/60 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="rounded-2xl bg-surface p-6 shadow-elevation-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="sign-in-modal-title" className="text-lg font-bold text-text-dark">{dict.auth.modalTitle}</h2>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="iop-btn-press focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted"
              aria-label={dict.auth.close}
            >
              ✕
            </button>
          </div>

          {status === "sent" ? (
            <div className="mt-6 rounded-xl border border-border bg-surface-alt p-5 text-center">
              <p className="font-semibold text-text-dark">{dict.auth.sentTitle}</p>
              <p className="mt-2 text-sm text-muted">
                {interpolate(dict.auth.sentBody, { email: email.trim() })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTurnstileToken("");
                  setStatus("idle");
                }}
                className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark"
              >
                {dict.auth.tryAgain}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {GOOGLE_ENABLED ? (
                <>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="iop-btn-press focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-dark transition hover:border-brand"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden focusable="false">
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1H1.3v3C3.3 21.3 7.3 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3v-3H1.3C.5 8.3 0 10.1 0 12s.5 3.7 1.3 5.3l3.8-3z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.3-3.2C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.7l3.8 3c.9-3 3.7-5.1 6.9-5.1z"
                      />
                    </svg>
                    {dict.auth.continueWithGoogle}
                  </button>
                  <div className="flex items-center gap-3 text-xs text-muted-light">
                    <span className="h-px flex-1 bg-border" aria-hidden />
                    {dict.auth.or}
                    <span className="h-px flex-1 bg-border" aria-hidden />
                  </div>
                </>
              ) : null}

              <form onSubmit={handleMagicLink} className="space-y-3" noValidate>
                <div>
                  <label
                    htmlFor="auth-magic-email"
                    className="mb-1 block text-xs font-semibold text-muted"
                  >
                    {dict.auth.emailLabel}
                  </label>
                  <input
                    id="auth-magic-email"
                    type="email"
                    autoComplete="email"
                    placeholder={dict.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    className="focus-ring w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-dark placeholder:text-muted-light"
                  />
                </div>
                <TurnstileField
                  onToken={setTurnstileToken}
                  action="auth-magic-link"
                  resetSignal={turnstileReset}
                />
                {status === "error" && errorMessage ? (
                  <p className="text-sm text-red-600" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
                <PrimaryButton
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full justify-center px-4 py-2.5 text-sm"
                >
                  {status === "sending" ? dict.auth.sending : dict.auth.sendLink}
                </PrimaryButton>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
