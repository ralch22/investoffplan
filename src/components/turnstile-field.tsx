"use client";

import Script from "next/script";
import { useEffect, useId, useState } from "react";
import { getTurnstileSiteKey, isTurnstileEnabled } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, string>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

interface TurnstileFieldProps {
  onToken: (token: string) => void;
  action?: string;
  className?: string;
}

export function TurnstileField({
  onToken,
  action = "turnstile-spin-v1",
  className,
}: TurnstileFieldProps) {
  const siteKey = getTurnstileSiteKey();
  const enabled = isTurnstileEnabled() && Boolean(siteKey);
  const callbackId = useId().replace(/:/g, "");
  const callbackName = `iopTurnstileCb_${callbackId}`;
  const [containerId] = useState(() => `turnstile-${callbackId}`);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const globals = window as unknown as Record<string, (token: string) => void>;
    globals[callbackName] = (token: string) => onToken(token);
    return () => {
      delete globals[callbackName];
    };
  }, [callbackName, enabled, onToken]);

  useEffect(() => {
    if (!enabled || !scriptReady || !window.turnstile) return;
    const el = document.getElementById(containerId);
    if (!el || el.dataset.rendered === "true") return;

    window.turnstile.render(el, {
      sitekey: siteKey!,
      action,
      callback: callbackName,
      theme: "light",
    });
    el.dataset.rendered = "true";
  }, [action, callbackName, containerId, enabled, scriptReady, siteKey]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div id={containerId} data-action="turnstile-spin-v1" className={className} />
    </>
  );
}