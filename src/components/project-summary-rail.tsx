"use client";

import { useState } from "react";
import { BrochureModal } from "@/components/brochure-modal";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import {
  WHATSAPP_PRIMARY,
  WHATSAPP_PRIMARY_DISPLAY,
  waHref,
} from "@/lib/contact-info";
import { useCurrency } from "@/hooks/use-currency";
import { formatPrice, pricePerSqftLabel } from "@/lib/format";
import { hasPaymentPlan } from "@/lib/investment-metrics";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate } from "@/i18n/config";

interface ProjectSummaryRailProps {
  projectName: string;
  projectSlug: string;
  minPriceAed: number;
  pricePerSqftAed?: number | null;
  paymentPlan: string;
  unitCount: number;
  handover: string;
  whatsapp: string;
  brochureUrl?: string;
}

export function ProjectSummaryRail({
  projectName,
  projectSlug,
  minPriceAed,
  pricePerSqftAed,
  paymentPlan,
  unitCount,
  handover,
  whatsapp,
  brochureUrl,
}: ProjectSummaryRailProps) {
  const [brochureOpen, setBrochureOpen] = useState(false);
  const { dict } = useI18n();
  const currency = useCurrency();
  const summary = dict.pdp.summary;

  // Convert through the shared currency so the rail agrees with the hero + SERP.
  const priceLabel =
    minPriceAed > 0 ? formatPrice(minPriceAed, currency) : dict.pdp.priceOnRequest;
  const pricePerSqft = pricePerSqftLabel(pricePerSqftAed, currency, dict);

  const projectWhatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  const advisorText = interpolate(summary.advisorWaMessage, { projectName });
  const advisorHref = waHref(WHATSAPP_PRIMARY, advisorText);

  function trackWhatsappClick(source: string) {
    trackEvent(ANALYTICS_EVENTS.WHATSAPP_CLICK, {
      project_name: projectName,
      source,
    });
  }

  const summaryRows = [
    ...(hasPaymentPlan(paymentPlan)
      ? [{ label: dict.pdp.keyFacts.paymentPlan, value: paymentPlan.trim() }]
      : []),
    { label: summary.delivery, value: handover },
    { label: summary.units, value: String(unitCount) },
  ];

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-elevation-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-light">
          {summary.startingFrom}
        </p>
        <p className="mt-1 text-2xl font-semibold text-brand">{priceLabel}</p>
        {pricePerSqft ? (
          <p className="text-sm font-medium text-muted">{pricePerSqft}</p>
        ) : null}

        <dl className="mt-4 divide-y divide-border border-y border-border">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="text-sm font-semibold text-text-dark text-end">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setBrochureOpen(true)}
            className="iop-btn-press focus-ring inline-flex items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {dict.pdp.cta.downloadBrochure}
          </button>
          <a
            href={projectWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick("pdp_rail")}
            className="iop-btn-press focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-elevation-sm transition hover:bg-[#1ebe57]"
          >
            <WhatsAppIcon />
            {summary.whatsappUs}
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-brand-muted/40 p-5">
        <p className="text-base font-semibold text-text-dark">
          {summary.speakTeam}
        </p>
        <p className="mt-2 text-sm text-muted">
          {interpolate(summary.teamBody, { name: projectName })}
        </p>
        <a
          href={advisorHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsappClick("pdp_rail_advisor")}
          className="iop-btn-press focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          <WhatsAppIcon />
          {WHATSAPP_PRIMARY_DISPLAY}
        </a>
      </div>

      <BrochureModal
        open={brochureOpen}
        onClose={() => setBrochureOpen(false)}
        projectName={projectName}
        projectSlug={projectSlug}
        brochureUrl={brochureUrl || "#brochure-request"}
        whatsapp={whatsapp}
      />
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
