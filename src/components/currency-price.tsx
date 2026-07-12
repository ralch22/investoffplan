"use client";

import { useCurrency } from "@/hooks/use-currency";
import {
  formatPrice,
  launchPriceLabel,
  pricePerSqftLabel,
} from "@/lib/format";
import { useI18n } from "@/i18n/locale-provider";

/**
 * Client price primitives for server-rendered surfaces (PDP). They take RAW AED
 * numbers and format them through the shared, persisted currency so prices on
 * server pages convert + stay consistent with the SERP without threading the
 * currency down from a client boundary.
 */

export function Price({
  aed,
  fallback,
}: {
  aed: number;
  fallback?: string;
}) {
  const currency = useCurrency();
  const { dict } = useI18n();
  if (!(aed > 0)) return <>{fallback ?? dict.pdp.priceOnRequest}</>;
  return <>{formatPrice(aed, currency)}</>;
}

export function LaunchPrice({
  minAed,
  maxAed,
}: {
  minAed: number;
  maxAed?: number;
}) {
  const currency = useCurrency();
  const { dict } = useI18n();
  return <>{launchPriceLabel(minAed, maxAed, currency, dict)}</>;
}

export function PricePerSqft({ aed }: { aed: number | null | undefined }) {
  const currency = useCurrency();
  const { dict } = useI18n();
  const label = pricePerSqftLabel(aed, currency, dict);
  return label ? <>{label}</> : null;
}
