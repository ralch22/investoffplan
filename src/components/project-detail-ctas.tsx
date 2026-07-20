"use client";

import { useEffect, useRef, useState } from "react";
import { BrochureButton } from "@/components/brochure-button";
import { BrochureModal } from "@/components/brochure-modal";
import { ContactButton } from "@/components/contact-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { resolveBrochureUrl } from "@/lib/brochure";
import { withUtm } from "@/lib/utm";
import { useI18n } from "@/i18n/locale-provider";

interface ProjectDetailCtasProps {
  projectName: string;
  projectSlug?: string;
  whatsapp: string;
  brochureUrl?: string;
  videoUrl?: string;
  virtualTourUrl?: string;
}

export function ProjectDetailCtas({
  projectName,
  projectSlug,
  whatsapp,
  brochureUrl,
  videoUrl,
  virtualTourUrl,
}: ProjectDetailCtasProps) {
  const [brochureOpen, setBrochureOpen] = useState(false);
  const { dict } = useI18n();
  const barRef = useRef<HTMLDivElement>(null);

  // Publish the bar's MEASURED height to :root --dock-cta-h (stylesheet 5.25rem
  // stays the SSR fallback). PageShell maps it into --bottom-dock, so main
  // padding / FAB / compare bar auto-track 2-line labels (AR) instead of
  // trusting a hardcoded approximation. Mirrors setConsentHeightPx.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const publish = () => {
      const h = bar.offsetHeight;
      if (h > 0) root.style.setProperty("--dock-cta-h", `${Math.ceil(h)}px`);
      else root.style.removeProperty("--dock-cta-h");
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--dock-cta-h");
    };
  }, []);
  const cta = dict.pdp.cta;

  const whatsappHref = withUtm(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, {
    medium: "whatsapp",
    content: "pdp_mobile_bar",
  });

  function trackWhatsappClick(source: string) {
    trackEvent(ANALYTICS_EVENTS.WHATSAPP_CLICK, {
      project_name: projectName,
      source,
    });
  }

  return (
    <>
      <div className="mt-6 hidden flex-wrap gap-3 md:flex">
        <BrochureButton
          projectName={projectName}
          variant="hero"
          onOpenModal={() => setBrochureOpen(true)}
        />
        <ContactButton phone={whatsapp} projectName={projectName} />
        {videoUrl ? (
          <a
            href="#media"
            className="iop-btn-press focus-ring inline-flex items-center gap-2 rounded-full border border-brand px-6 py-3.5 text-base font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            {cta.watchVideo}
          </a>
        ) : null}
      </div>

      <div className="mt-4 hidden gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4">
        <ActionPill label={cta.discoverMore} href="#units" filled />
        <button
          type="button"
          onClick={() => setBrochureOpen(true)}
          className="iop-btn-press focus-ring rounded-full border border-brand py-3 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          {cta.downloadBrochure}
        </button>
        {(virtualTourUrl ?? videoUrl) ? (
          <a
            href="#media"
            className="iop-btn-press focus-ring rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
          >
            {virtualTourUrl ? cta.virtualTour : cta.watchVideo}
          </a>
        ) : null}
        <a
          href={withUtm(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, {
            medium: "whatsapp",
            content: "pdp_pill",
          })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsappClick("pdp_pill")}
          className="iop-btn-press focus-ring rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          {cta.checkAvailability}
        </a>
      </div>

      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-[var(--consent-h,0px)] z-[var(--z-bottom-bar)] border-t border-border bg-surface/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-elevation-lg backdrop-blur-xl lg:hidden"
        role="region"
        aria-label={dict.a11y.quickActions}
      >
        <div className="mx-auto flex max-w-[1200px] gap-3">
          <button
            type="button"
            onClick={() => setBrochureOpen(true)}
            className="iop-btn-press focus-ring flex-1 rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {cta.downloadBrochure}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick("pdp_mobile_bar")}
            className="iop-btn-press focus-ring flex-1 rounded-full border border-brand py-3.5 text-center text-sm font-semibold text-brand transition hover:bg-brand-muted"
          >
            {dict.common.whatsapp}
          </a>
        </div>
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

function ActionPill({
  label,
  href,
  filled,
}: {
  label: string;
  href: string;
  filled?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        filled
          ? "iop-btn-press focus-ring rounded-full bg-brand py-3 text-center text-sm font-bold text-white transition hover:bg-brand-dark"
          : "iop-btn-press focus-ring rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
      }
    >
      {label}
    </a>
  );
}