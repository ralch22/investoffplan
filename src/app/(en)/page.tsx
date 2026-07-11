import type { Metadata } from "next";
import { HomeBody } from "@/components/home/home-body";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: { absolute: "Off-Plan Properties for Sale in Dubai & the UAE | invest off-plan" },
  description:
    "Off-plan properties for sale in Dubai & the UAE — unit-level prices, floor plans, payment plans, developer brochures, compare tools, and live DLD market data.",
  alternates: {
    canonical: getSiteUrl(),
    languages: { en: getSiteUrl() || "/", ar: `${getSiteUrl()}/ar` },
  },
};

export default function HomePage() {
  return <HomeBody locale="en" />;
}
