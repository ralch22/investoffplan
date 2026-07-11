"use client";

import { NewsletterForm } from "@/components/newsletter-form";
import { useI18n } from "@/i18n/locale-provider";

export function NewsletterSection() {
  const { dict } = useI18n();
  const t = dict.footer.newsletter;
  return (
    <section className="relative overflow-hidden bg-surface-darker text-white">
      <div className="mx-auto grid grid-cols-1 max-w-[1200px] md:grid-cols-2">
        {/* Left: image + headline */}
        <div className="relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-surface-dark md:min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- static public asset, Workers optimizer bypassed */}
          <img
            src="/images/marina-heights.jpg"
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Brand overlay for legibility over the property imagery */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/80 via-surface-dark/70 to-surface-darker/90" />
          <div className="relative p-8 md:p-12">
            <p className="font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold italic leading-tight text-white">
              {t.titleLine1}<br />{t.titleLine2}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              {t.blurb}
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <NewsletterForm dark />
        </div>
      </div>
    </section>
  );
}
