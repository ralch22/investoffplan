export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://investoffplan-preview.emerge-digital.workers.dev";

export function getSiteUrl(): string {
  return SITE_URL;
}