"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdvisorWidget } from "@/components/advisor/advisor-widget";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { useFavoritesSync } from "@/hooks/use-favorites-sync";
import { useCurrency } from "@/hooks/use-currency";
import { setCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/locale-provider";

/** Which fixture owns the mobile bottom edge (exactly one). */
export type MobileDock = "tabs" | "cta" | "none";

interface PageShellProps {
  children: React.ReactNode;
  /**
   * Renders the header currency selector. The currency VALUE is always shared +
   * persisted (via the currency store) regardless of this flag — this only
   * controls whether the toggle is offered, so pages that convert prices
   * (SERP, PDP, compare) show it while purely-AED market pages don't.
   */
  showCurrency?: boolean;
  headerVariant?: "light" | "transparent";
  mobileDock?: MobileDock;
}

// Height each dock reserves at the mobile bottom edge; every fixed fixture and
// <main>'s padding reads --bottom-dock so they stack instead of overlap.
// Both tabs/cta tokens already include safe-area. "none" still reserves the
// home-indicator inset so FABs (advisor) never sit under the system gesture bar.
const DOCK_H: Record<MobileDock, string> = {
  tabs: "var(--bottom-bar-h)",
  cta: "var(--dock-cta-h)",
  none: "env(safe-area-inset-bottom, 0px)",
};

export function PageShell({
  children,
  showCurrency = false,
  headerVariant = "light",
  mobileDock = "tabs",
}: PageShellProps) {
  // Server-favorites sync: merges localStorage with the account on sign-in.
  // PageShell mounts per page, but the hook dedupes module-wide per session.
  useFavoritesSync();
  const { dict } = useI18n();

  // Single shared, persisted currency (localStorage-backed) — one source of
  // truth across every page, tab, and reload.
  const currency = useCurrency();
  const handleCurrency = showCurrency ? setCurrency : undefined;

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ "--bottom-dock": DOCK_H[mobileDock] } as React.CSSProperties}
    >
      <a href="#main-content" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <SiteHeader
        currency={currency}
        onCurrencyChange={handleCurrency}
        variant={headerVariant}
      />
      {/* tabIndex=-1 so skip-link fragment focus lands on the landmark (WCAG 2.4.1). */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none max-lg:pb-[var(--bottom-dock)]"
      >
        {children}
      </main>
      <SiteFooter />
      <AdvisorWidget />
      {mobileDock === "tabs" ? <BottomTabBar /> : null}
    </div>
  );
}