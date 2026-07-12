import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { LocationsPageContent } from "@/app/(en)/locations/page";

export const metadata: Metadata = (() => {
  const base = getSiteUrl();
  return { alternates: { canonical: `${base}/ar/locations`, languages: { "x-default": `${base}/locations`, en: `${base}/locations`, ar: `${base}/ar/locations` } } };
})();

export default function ArLocationsPage() {
  return <LocationsPageContent locale="ar" />;
}
