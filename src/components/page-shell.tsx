"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdvisorWidget } from "@/components/advisor/advisor-widget";
import type { CurrencyCode } from "@/lib/types";

interface PageShellProps {
  children: React.ReactNode;
  currency?: CurrencyCode;
  onCurrencyChange?: (value: CurrencyCode) => void;
  headerVariant?: "light" | "transparent";
}

export function PageShell({
  children,
  currency: currencyProp,
  onCurrencyChange,
  headerVariant = "light",
}: PageShellProps) {
  const [internalCurrency, setInternalCurrency] = useState<CurrencyCode>("AED");
  const currency = currencyProp ?? internalCurrency;
  const handleCurrency =
    onCurrencyChange ?? ((value: CurrencyCode) => setInternalCurrency(value));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader
        currency={currency}
        onCurrencyChange={handleCurrency}
        variant={headerVariant}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <AdvisorWidget />
    </div>
  );
}