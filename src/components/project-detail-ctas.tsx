"use client";

import { useState } from "react";
import { BrochureButton } from "@/components/brochure-button";
import { BrochureModal } from "@/components/brochure-modal";
import { ContactButton } from "@/components/contact-button";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { resolveBrochureUrl } from "@/lib/brochure";
import { withUtm } from "@/lib/utm";

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
          url={brochureUrl || "#brochure-request"}
          projectName={projectName}
          variant="hero"
          onOpenModal={() => setBrochureOpen(true)}
        />
        <ContactButton phone={whatsapp} projectName={projectName} />
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="video"
            className="inline-flex items-center gap-2 rounded-full border border-brand px-6 py-3.5 text-base font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Watch video
          </a>
        ) : null}
      </div>

      <div className="mt-4 hidden gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4">
        <ActionPill label="Discover more" href="#units" filled />
        <button
          type="button"
          onClick={() => setBrochureOpen(true)}
          className="rounded-full border border-brand py-3 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          Download brochure
        </button>
        {virtualTourUrl ?? videoUrl ? (
          <a
            href={virtualTourUrl ?? videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
          >
            {virtualTourUrl ? "Virtual tour" : "Watch video"}
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
          className="rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          Check availability
        </a>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-border bg-surface/95 p-4 shadow-elevation-lg backdrop-blur-xl md:hidden"
        role="region"
        aria-label="Quick actions"
      >
        <div className="mx-auto flex max-w-[1200px] gap-3">
          <button
            type="button"
            onClick={() => setBrochureOpen(true)}
            className="iop-btn-press flex-1 rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Download brochure
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick("pdp_mobile_bar")}
            className="iop-btn-press flex-1 rounded-full border border-brand py-3.5 text-center text-sm font-semibold text-brand transition hover:bg-brand-muted"
          >
            WhatsApp
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
          ? "rounded-full bg-brand py-3 text-center text-sm font-bold text-white transition hover:bg-brand-dark"
          : "rounded-full border border-brand py-3 text-center text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
      }
    >
      {label}
    </a>
  );
}