import type { Metadata } from "next";
import { GeoInvestPage, type GeoConfig } from "@/components/geo-invest-page";
import { getSiteUrl } from "@/lib/site-url";
import { aedToInrLabel, fxCaption, getFxPin } from "@/lib/fx";

/**
 * International landing for the India search cluster ("invest in dubai" IN,
 * "dubai flat price in indian rupees" + siblings — the KD-0 rupee tail asks
 * literally for prices in INR, which is what this page answers with real
 * catalog prices + the committed FX pin). EN-only; hreflang self + x-default.
 * No visa/tax/legal claims — ungroundable, handled by the human team.
 */

const config: GeoConfig = {
  slug: "invest-from-india",
  audience: "India",
  currency: "INR",
  h1: "Buy Dubai Off-Plan Property from India",
  intro:
    "Real launch prices in rupees, real sold-price data from the Dubai Land Department, and payment plans straight from each developer's schedule — everything an India-based buyer needs to evaluate Dubai off-plan, in one place.",
  faqs: [
    {
      q: "What does a Dubai apartment cost in Indian rupees?",
      a: `Off-plan projects in our live catalog start under AED 800,000 — roughly ${aedToInrLabel(800_000)}. A mid-market AED 2,000,000 project is about ${aedToInrLabel(2_000_000)}. ${fxCaption("INR")}`,
    },
    {
      q: "Can Indian citizens buy property in Dubai?",
      a: "Yes. Foreign nationals, including Indian citizens, can buy freehold property in Dubai's designated freehold areas — which include all the communities featured on this site.",
    },
    {
      q: "Can I pay for a Dubai property in rupees?",
      a: "No — contracts and instalments are in UAE dirhams (AED). The rupee figures on this page are indicative conversions at a published reference rate so you can benchmark budgets; your bank or exchange house handles the INR–AED transfer.",
    },
    {
      q: "What is off-plan property?",
      a: "Property bought directly from the developer before construction completes, usually at a lower entry price than ready stock and paid through a staged plan. Our sold-price pages show how off-plan and ready prices compare in each community, from Dubai Land Department data.",
    },
    {
      q: "How do payment plans work?",
      a: "Most projects in our catalog publish a structured plan: a deposit, construction-linked instalments, and a balance at or after handover. Each project page on this site lists the developer's actual schedule.",
    },
  ],
};

export function generateMetadata(): Metadata {
  const base = getSiteUrl();
  const url = `${base}/invest-from-india`;
  const description = `Dubai off-plan property for India-based buyers: live launch prices in rupees (from ${aedToInrLabel(800_000)}), DLD sold-price data by community, and real developer payment plans. Rates as of ${getFxPin().asOf}.`;
  return {
    title: "Invest in Dubai from India — Prices in Rupees",
    description,
    alternates: { canonical: url, languages: { "x-default": url, en: url } },
    openGraph: { type: "website", url, title: "Buy Dubai Off-Plan Property from India", description },
  };
}

export default function Page() {
  return <GeoInvestPage config={config} />;
}
