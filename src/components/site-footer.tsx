import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { NewsletterSection } from "@/components/newsletter-section";

const MAIN_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/developers", label: "Developers" },
  { href: "/areas", label: "Areas" },
  { href: "/guides", label: "Guides" },
  { href: "/news", label: "News" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const GUIDE_LINKS = [
  { href: "/guides/why-invest-off-plan-dubai", label: "Buying Off-Plan" },
  { href: "/developers", label: "Finding the Right Developer" },
  { href: "/guides/understanding-payment-plans", label: "Understanding Payment Plans" },
  { href: "/guides/foreign-investor-guide", label: "Off-Plan for Foreign Investors" },
  { href: "/faq/golden-visa", label: "Acquiring the Golden Visa" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <NewsletterSection />
      <div className="bg-surface-darker text-white">
        {/* Main footer grid */}
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-0 md:grid-cols-2">
          {/* Left: dark aerial photo panel */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-surface-dark px-8 py-12 md:min-h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-darker/60 to-surface-dark/90" />
            <div className="relative">
              <BrandLogo
                variant="stacked-white-arlo"
                className="h-auto w-[10rem] max-w-full"
              />
              <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {MAIN_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Right: guides + contact */}
          <div className="px-8 py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Guides
            </p>
            <ul className="mt-4 space-y-2">
              {GUIDE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
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
              <span>Telephone: +971 44 321 620</span>
              <span>Email: iop@investoffplan.com</span>
              <span>Address: Business Bay, Dubai</span>
            </div>
            <div className="flex gap-5">
              <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
              <Link href="/cookie-policy" className="hover:text-white">Cookies</Link>
            </div>
          </div>
          <div className="border-t border-white/5 px-8 py-4 text-center text-xs text-white/40">
            <p>© {new Date().getFullYear()} invest off-plan · Powered by Aria Properties LLC · DRN 20678, a licensed real estate brokerage in Dubai</p>
          </div>
        </div>
      </div>
    </footer>
  );
}