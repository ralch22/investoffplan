import type { CurrencyCode } from "./types";

const STORAGE_KEY = "iop-currency";

export const CURRENCY_CHANGED_EVENT = "iop-currency-changed";

const DEFAULT_CURRENCY: CurrencyCode = "AED";

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "AED" || value === "USD";
}

function notifyCurrencyChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT));
}

export function getCurrency(): CurrencyCode {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isCurrencyCode(raw) ? raw : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function setCurrency(currency: CurrencyCode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    // ignore quota / privacy-mode failures — the event still fires so mounted
    // components update for the session.
  }
  notifyCurrencyChanged();
}
