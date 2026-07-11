"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdvisorWidget } from "@/components/advisor/advisor-widget";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { useFavoritesSync } from "@/hooks/use-favorites-sync";
import type { CurrencyCode } from "@/lib/types";

/** Which fixture owns the mobile bottom edge (exactly one). */
export type MobileDock = "tabs" | "cta" | "none";

interface PageShellProps {
  children: React.ReactNode;
  currency?: CurrencyCode;
  onCurrencyChange?: (value: CurrencyCode) => void;
  headerVariant?: "light" | "transparent";
  mobileDock?: MobileDock;
}

// Height each dock reserves at the mobile bottom edge; every fixed fixture and
// <main>'s padding reads --bottom-dock so they stack instead of overlap.
const DOCK_H: Record<MobileDock, string> = {
  tabs: "var(--bottom-bar-h)",
  cta: "var(--dock-cta-h)",
  none: "0px",
};

export function PageShell({
  children,
  currency: currencyProp,
  onCurrencyChange,
  headerVariant = "light",
  mobileDock = "tabs",
}: PageShellProps) {
  // Server-favorites sync: merges localStorage with the account on sign-in.
  // PageShell mounts per page, but the hook dedupes module-wide per session.
  useFavoritesSync();

  const [internalCurrency, setInternalCurrency] = useState<CurrencyCode>("AED");
  const currency = currencyProp ?? internalCurrency;
  const handleCurrency =
    onCurrencyChange ?? ((value: CurrencyCode) => setInternalCurrency(value));

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ "--bottom-dock": DOCK_H[mobileDock] } as React.CSSProperties}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader
        currency={currency}
        onCurrencyChange={handleCurrency}
        variant={headerVariant}
      />
      <main id="main-content" className="flex-1 max-lg:pb-[var(--bottom-dock)]">
        {children}
      </main>
      <SiteFooter />
      <AdvisorWidget />
      {mobileDock === "tabs" ? <BottomTabBar /> : null}
    </div>
  );
}