import rates from "../../data/fx-rates.json";

/**
 * Pinned FX conversion for the international landing pages.
 *
 * The rate is COMMITTED in data/fx-rates.json with its source and as-of date —
 * never fetched live — so every rendered number is traceable to a repo data
 * source (the same grounding rule as the DLD aggregates). Conversions are
 * indicative and always rendered with the as-of caption; AED remains the
 * transactional currency everywhere.
 *
 * The rupee-denominated search cluster this serves ("dubai flat price in
 * indian rupees" and siblings) asks a literal question — what does it cost in
 * my currency — so display formats follow each audience's own conventions:
 * INR in lakh/crore, GBP in plain thousands.
 */

export interface FxPin {
  base: string;
  source: string;
  asOf: string;
  rates: { INR: number; GBP: number };
}

export function getFxPin(): FxPin {
  return rates as FxPin;
}

const LAKH = 100_000;
const CRORE = 10_000_000;

/** AED → Indian-convention string: "₹2.63 crore" / "₹66 lakh". */
export function aedToInrLabel(aed: number): string {
  const inr = aed * getFxPin().rates.INR;
  if (inr >= CRORE) {
    const crore = inr / CRORE;
    return `₹${crore >= 10 ? Math.round(crore) : Math.round(crore * 100) / 100} crore`;
  }
  const lakh = inr / LAKH;
  return `₹${Math.round(lakh)} lakh`;
}

/** AED → "£203,000" (rounded to the nearest thousand for indicative display). */
export function aedToGbpLabel(aed: number): string {
  const gbp = aed * getFxPin().rates.GBP;
  return `£${(Math.round(gbp / 1000) * 1000).toLocaleString("en-GB")}`;
}

/** One-line provenance caption rendered wherever a conversion appears. */
export function fxCaption(currency: "INR" | "GBP"): string {
  const pin = getFxPin();
  const rate =
    currency === "INR"
      ? `1 AED = ₹${pin.rates.INR.toFixed(2)}`
      : `1 AED = £${pin.rates.GBP.toFixed(4)}`;
  return `Indicative conversion at ${rate} (${pin.source}, ${pin.asOf}). All transactions are in AED.`;
}
