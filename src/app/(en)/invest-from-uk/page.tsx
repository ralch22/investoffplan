import type { Metadata } from "next";
import { GeoInvestPage, type GeoConfig } from "@/components/geo-invest-page";
import { getSiteUrl } from "@/lib/site-url";
import { aedToGbpLabel, fxCaption, getFxPin } from "@/lib/fx";

/**
 * International landing for the UK search cluster ("buy property in dubai" UK,
 * "dubai property for sale in pounds", "off plan property dubai" UK — high-CPC
 * commercial intent). EN-only; hreflang self + x-default. No visa/tax/legal
 * claims — ungroundable, handled by the human team.
 */

const config: GeoConfig = {
  slug: "invest-from-uk",
  audience: "UK",
  currency: "GBP",
  h1: "Buy Dubai Off-Plan Property from the UK",
  intro:
    "Launch prices in pounds, sold-price evidence from the Dubai Land Department, and developer payment plans as published — a UK buyer's working view of the Dubai off-plan market, without the brochure gloss.",
  faqs: [
    {
      q: "How much does a Dubai apartment cost in pounds?",
      a: `Off-plan projects in our live catalog start under AED 800,000 — roughly ${aedToGbpLabel(800_000)}. A mid-market AED 2,000,000 project is about ${aedToGbpLabel(2_000_000)}. ${fxCaption("GBP")}`,
    },
    {
      q: "Can UK citizens buy property in Dubai?",
      a: "Yes. Foreign nationals, including UK citizens, can buy freehold property in Dubai's designated freehold areas — which include all the communities featured on this site.",
    },
    {
      q: "Can I pay in pounds?",
      a: "No — contracts and instalments are in UAE dirhams (AED). The sterling figures on this page are indicative conversions at a published reference rate for benchmarking; your bank or FX provider handles the GBP–AED transfer.",
    },
    {
      q: "Is off-plan cheaper than ready property?",
      a: "Often, but not always — it varies by community. Our sold-prices pages compare off-plan and ready transaction prices per community using Dubai Land Department data, so you can see the spread for the exact area you're considering rather than a market-wide claim.",
    },
    {
      q: "How do payment plans work?",
      a: "Most projects in our catalog publish a structured plan: a deposit, construction-linked instalments, and a balance at or after handover. Each project page lists the developer's actual schedule.",
    },
  ],
};

export function generateMetadata(): Metadata {
  const base = getSiteUrl();
  const url = `${base}/invest-from-uk`;
  const description = `Dubai off-plan property for UK buyers: launch prices in pounds (from ${aedToGbpLabel(800_000)}), DLD sold-price data by community, and real developer payment plans. Rates as of ${getFxPin().asOf}.`;
  return {
    title: "Invest in Dubai from the UK — Prices in Pounds",
    description,
    alternates: { canonical: url, languages: { "x-default": url, en: url } },
    openGraph: { type: "website", url, title: "Buy Dubai Off-Plan Property from the UK", description },
  };
}

export default function Page() {
  return <GeoInvestPage config={config} />;
}
