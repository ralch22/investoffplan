import { NewsletterForm } from "@/components/newsletter-form";
import Image from "next/image";

export function NewsletterSection() {
  return (
    <section className="relative overflow-hidden bg-surface-darker text-white">
      <div className="mx-auto grid max-w-[1200px] md:grid-cols-2">
        {/* Left: image + headline */}
        <div className="relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-surface-dark md:min-h-[420px]">
          {/* Background image placeholder with brand overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/80 via-surface-dark/70 to-surface-darker/90" />
          <div className="relative p-8 md:p-12">
            <p className="font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold italic leading-tight text-white">
              Off&#8209;Plan<br />Newsletter.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Exclusive insights on the latest off-plan opportunities.
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