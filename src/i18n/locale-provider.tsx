"use client";

import { createContext, useContext, type ReactNode } from "react";
import { en, type Dict } from "./dictionaries/en";
import type { Locale } from "./config";

interface I18nContextValue {
  locale: Locale;
  dict: Dict;
}

const I18nContext = createContext<I18nContextValue>({ locale: "en", dict: en });

/**
 * Mounted only in the (ar) root layout. Client components fall back to the
 * English dictionary when no provider exists, so the EN tree needs no changes.
 */
export function LocaleProvider({
  locale,
  dict,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
