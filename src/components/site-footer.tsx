"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { NewsletterSection } from "@/components/newsletter-section";
import { useI18n } from "@/i18n/locale-provider";
import { interpolate, localePath } from "@/i18n/config";

const MAIN_LINKS = [
  { href: "/projects", key: "projects" },
  { href: "/developers", key: "developers" },
  { href: "/communities", key: "areas" },
  { href: "/locations", key: "locations" },
  { href: "/guides", key: "guides" },
  { href: "/news", key: "news" },
  { href: "/faq", key: "faq" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

const COLLECTION_LINKS = [
  { href: "/collections/waterfront", key: "waterfrontProjects" },
  { href: "/collections/branded", key: "brandedResidences" },
  { href: "/collections/under-2m", key: "underAed2m" },
  { href: "/collections/dubai", key: "dubaiOffPlan" },
  { href: "/collections/ras-al-khaimah", key: "rasAlKhaimah" },
] as const;

const GUIDE_LINKS = [
  { href: "/guides/why-invest-off-plan-dubai", key: "buyingOffPlan" },
  { href: "/developers", key: "findingRightDeveloper" },
  { href: "/guides/understanding-payment-plans", key: "understandingPaymentPlans" },
  { href: "/guides/foreign-investor-guide", key: "foreignInvestors" },
  { href: "/faq/golden-visa", key: "goldenVisa" },
] as const;

export function SiteFooter() {
  const { locale, dict } = useI18n();
  return (
    <footer className="mt-auto">
      <NewsletterSection />
      <div className="bg-surface-darker text-white">
        {/* Main footer grid */}
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-0 md:grid-cols-2">
          {/* Left: dark aerial photo panel */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-surface-dark px-8 py-12 md:min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static public asset, Workers optimizer bypassed */}
            <img
              src="/images/skyline-terraces.jpg"
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-surface-darker/70 to-surface-dark/90" />
            <div className="relative">
              <BrandLogo
                variant="stacked-white-arlo"
                className="h-auto w-[10rem] max-w-full"
              />
              <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {MAIN_LINKS.map((link) => (
                  <Link
                    key={link.key}
                    href={localePath(locale, link.href)}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {dict.nav[link.key]}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Right: guides + collections */}
          <div className="grid gap-10 px-8 py-12 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                {dict.footer.columns.guides}
              </p>
              <ul className="mt-4 space-y-2">
                {GUIDE_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={localePath(locale, link.href)}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {dict.footer.links[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                {dict.footer.columns.collections}
              </p>
              <ul className="mt-4 space-y-2">
                {COLLECTION_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={localePath(locale, link.href)}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {dict.footer.links[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-8 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-5">
              {/* Social icons */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
            <div className="flex flex-wrap gap-5">
              <span dir="ltr">{interpolate(dict.footer.contact.telephone, { phone: "+971 44 321 620" })}</span>
              <span>{interpolate(dict.footer.contact.email, { email: "iop@investoffplan.com" })}</span>
              <span>{dict.footer.contact.address}</span>
            </div>
            <div className="flex gap-5">
              <Link href="/privacy-policy" className="hover:text-white">{dict.footer.privacy}</Link>
              <Link href="/cookie-policy" className="hover:text-white">{dict.footer.cookies}</Link>
            </div>
          </div>
          <div className="border-t border-white/5 px-8 py-4 text-center text-xs text-white/40">
            <p>{interpolate(dict.footer.legal, { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}