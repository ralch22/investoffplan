"use client";

import { useEffect, useState } from "react";
import type { CurrencyCode } from "@/lib/types";
import { CURRENCY_CHANGED_EVENT, getCurrency } from "@/lib/currency";

/**
 * Shared, persisted currency. Reads localStorage (key `iop-currency`) and
 * re-renders on the in-tab CURRENCY_CHANGED_EVENT and cross-tab `storage`
 * event, so every mounted component (PDP, SERP, header selector) stays in sync.
 * Starts at "AED" to match SSR HTML; the effect reconciles to the stored value
 * after mount (mirrors useFavoritesCount).
 */
export function useCurrency(): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>("AED");

  useEffect(() => {
    const sync = () => setCurrency(getCurrency());
    sync();
    window.addEventListener(CURRENCY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return currency;
}
