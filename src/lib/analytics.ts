"use client";

import { sendGAEvent } from "@next/third-parties/google";

export const ANALYTICS_EVENTS = {
  BROCHURE_OPEN: "brochure_open",
  CONTACT_SUBMIT: "contact_submit",
  COMPARE_ADD: "compare_add",
  WHATSAPP_CLICK: "whatsapp_click",
  SEARCH_SUBMIT: "search_submit",
  SUGGEST_CLICK: "search_suggest_click",
  QUIZ_COMPLETE: "quiz_complete",
  ROI_CALC: "roi_calc",
  ALERT_SUBSCRIBE: "alert_subscribe",
  COMPARE_VIEW: "compare_view",
  PDP_SECTION_VIEW: "pdp_section_view",
  SIGN_IN: "sign_in",
  BROCHURE_REQUEST: "brochure_request",
  BROCHURE_WHATSAPP_FALLBACK: "brochure_whatsapp_fallback",
  GATE_PROMPT: "gate_prompt",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(event: AnalyticsEventName, params?: EventParams) {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  sendGAEvent("event", event, params ?? {});
}