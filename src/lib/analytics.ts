"use client";

import { sendGAEvent } from "@next/third-parties/google";

export const ANALYTICS_EVENTS = {
  BROCHURE_OPEN: "brochure_open",
  CONTACT_SUBMIT: "contact_submit",
  COMPARE_ADD: "compare_add",
  WHATSAPP_CLICK: "whatsapp_click",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(event: AnalyticsEventName, params?: EventParams) {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  sendGAEvent("event", event, params ?? {});
}