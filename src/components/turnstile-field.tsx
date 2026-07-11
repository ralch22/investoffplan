"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/locale-provider";
import { getTurnstileSiteKey, isTurnstileEnabled } from "@/lib/turnstile";

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

interface TurnstileFieldProps {
  onToken: (token: string) => void;
  action?: string;
  className?: string;
  /**
   * Bump this (e.g. `setReset((n) => n + 1)`) on every FAILED submit path.
   * Turnstile tokens are single-use — resubmitting a consumed token 403s with
   * timeout-or-duplicate forever. When the value changes, the widget resets
   * (issuing a fresh challenge/token) and the stored token is cleared via
   * `onToken("")`. A no-op while Turnstile is disabled (no site key).
   */
  resetSignal?: number;
}

export function TurnstileField({
  onToken,
  action = "turnstile-spin-v1",
  className,
  resetSignal,
}: TurnstileFieldProps) {
  const siteKey = getTurnstileSiteKey();
  const enabled = isTurnstileEnabled() && Boolean(siteKey);
  const { dict } = useI18n();
  const instanceId = useId().replace(/:/g, "");
  const [containerId] = useState(() => `turnstile-${instanceId}`);
  const [scriptReady, setScriptReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const autoRetriedRef = useRef(false);
  // Latest onToken without re-rendering the widget when its identity changes.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  /** Clear the stored token and re-run the challenge for a fresh one. */
  const resetWidget = useCallback(() => {
    onTokenRef.current("");
    const widgetId = widgetIdRef.current;
    if (widgetId !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
      } catch {
        // Widget already removed — the next mount renders a fresh one.
      }
    }
  }, []);

  // Poll for the script when it was already loaded by an earlier instance —
  // next/script onLoad only fires for the FIRST mount of a given src, so a
  // widget mounted later (e.g. the brochure modal, after the footer newsletter
  // form loaded the script) would otherwise never render and its form 403s.
  useEffect(() => {
    if (!enabled || scriptReady) return;
    if (window.turnstile) {
      setScriptReady(true);
      return;
    }
    const poll = setInterval(() => {
      if (window.turnstile) {
        setScriptReady(true);
        clearInterval(poll);
      }
    }, 250);
    return () => clearInterval(poll);
  }, [enabled, scriptReady]);

  useEffect(() => {
    if (!enabled || !scriptReady || !window.turnstile) return;
    const el = document.getElementById(containerId);
    if (!el || el.dataset.rendered === "true") return;

    widgetIdRef.current = window.turnstile.render(el, {
      sitekey: siteKey!,
      action,
      theme: "light",
      callback: (token: string) => {
        autoRetriedRef.current = false;
        setErrored(false);
        onTokenRef.current(token);
      },
      // Tokens expire ~5 min after issuance — clear + reset so the next
      // submit carries a fresh token instead of 403ing.
      "expired-callback": () => {
        resetWidget();
      },
      "timeout-callback": () => {
        resetWidget();
      },
      "error-callback": () => {
        onTokenRef.current("");
        if (!autoRetriedRef.current) {
          // One silent retry, then surface a manual Retry hint — never loop
          // reset→error→reset against a persistent failure.
          autoRetriedRef.current = true;
          resetWidget();
        } else {
          setErrored(true);
        }
      },
    });
    el.dataset.rendered = "true";

    return () => {
      // Modals unmount/remount their form — remove the stale widget so a
      // re-opened modal renders a fresh one instead of a dead iframe.
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Already gone.
        }
      }
      widgetIdRef.current = null;
      delete el.dataset.rendered;
    };
  }, [action, containerId, enabled, scriptReady, siteKey, resetWidget]);

  // Parent-driven reset (see resetSignal JSDoc). State clears during render
  // (React's adjust-state-on-prop-change pattern); the widget reset itself —
  // an external system call — happens in the effect below.
  const [prevResetSignal, setPrevResetSignal] = useState(resetSignal);
  if (resetSignal !== prevResetSignal) {
    setPrevResetSignal(resetSignal);
    if (errored) setErrored(false);
  }
  const lastResetSignalRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === undefined || resetSignal === lastResetSignalRef.current) return;
    lastResetSignalRef.current = resetSignal;
    if (!enabled) return;
    autoRetriedRef.current = false;
    resetWidget();
  }, [enabled, resetSignal, resetWidget]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div id={containerId} data-action="turnstile-spin-v1" className={className} />
      {errored ? (
        <p className="iop-field-error" role="alert">
          {dict.common.turnstileError}{" "}
          <button
            type="button"
            onClick={() => {
              setErrored(false);
              autoRetriedRef.current = false;
              resetWidget();
            }}
            className="font-semibold underline underline-offset-2"
          >
            {dict.common.retry}
          </button>
        </p>
      ) : null}
    </>
  );
}
