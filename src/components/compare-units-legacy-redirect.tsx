"use client";

import { useEffect } from "react";

/**
 * Legacy deep links used `/compare?units=a,b,c`. The compare hub must stay
 * static/ISR (no searchParams) so Workers don't rebuild the full catalog on
 * every request — that path 503'd with CF error 1102. Client redirect preserves
 * old links without opting the hub into dynamic rendering.
 */
export function CompareUnitsLegacyRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const units = new URLSearchParams(window.location.search).get("units");
    if (!units) return;
    const base = window.location.pathname.startsWith("/ar")
      ? "/ar/compare/units"
      : "/compare/units";
    window.location.replace(`${base}?units=${encodeURIComponent(units)}`);
  }, []);
  return null;
}
