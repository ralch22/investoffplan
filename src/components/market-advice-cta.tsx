import { WHATSAPP_PRIMARY, waHref } from "@/lib/contact-info";
import { LocaleLink } from "@/components/locale-link";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

/**
 * Contextual advisor CTA for high-intent decision-stage pages (area comparisons,
 * market-data views). Pre-fills a WhatsApp message with the exact context so the
 * lead lands warm. No form/backend — routes to the existing WhatsApp line + contact.
 */
export function MarketAdviceCta({
  context,
  locale = "en",
  heading,
  blurb,
}: {
  /** e.g. "Jumeirah Village Circle vs Business Bay" — folded into the WhatsApp text. */
  context: string;
  locale?: Locale;
  heading?: string;
  blurb?: string;
}) {
  const dict = getDictionary(locale);
  const t = dict.marketAdvice;
  const waText = interpolate(t.waMessage, { context });
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface-darker p-6 text-white md:p-8">
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-semibold">
            {heading ?? t.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{blurb ?? t.blurb}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a
            href={waHref(WHATSAPP_PRIMARY, waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="iop-btn-press focus-ring inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.7.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
            </svg>
            {t.whatsappCta}
          </a>
          <LocaleLink
            href="/contact"
            className="iop-btn-press focus-ring inline-flex items-center rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-text-dark"
          >
            {t.bookConsultation}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
