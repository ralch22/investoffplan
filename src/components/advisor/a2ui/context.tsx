"use client";

import { createContext, useContext } from "react";

/**
 * Bridges A2UI catalog components back to the widget's chat state for the few
 * things that must live there (lead-done flag + "thanks" message append),
 * without routing through an LLM turn. Kept in its own module so
 * `surface.tsx` → `catalog.tsx` → `lead-form.tsx` never cycles back to surface.
 */
export interface AdvisorA2uiHandlers {
  /** True once a callback lead has been submitted this session. */
  leadDone: boolean;
  /** Called after a successful lead submit so the widget can react. */
  onLeadSubmitted: () => void;
}

export const AdvisorA2uiContext = createContext<AdvisorA2uiHandlers>({
  leadDone: false,
  onLeadSubmitted: () => {},
});

export const useAdvisorA2ui = () => useContext(AdvisorA2uiContext);
