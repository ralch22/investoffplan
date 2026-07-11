import { DLD_FEE_PCT } from "./mortgage";

/**
 * Off-plan ROI / rental-yield estimator — a pure, side-effect-free calculator so
 * it can be unit-tested and shared between the client tool and any server render.
 *
 * Honesty rules (see .claude/skills/ship/SKILL.md): the tool never invents a
 * yield or appreciation figure. Prefills come only from anonymized DLD 2025
 * market data (passed in as props) or from the user; appreciation is hard-capped
 * at {@link APPRECIATION_CAP_PCT} to mirror the yield-plausibility cap elsewhere.
 *
 * The model assumes a cash purchase paid across the payment plan (no mortgage —
 * that lives in the separate mortgage tool). Return % is measured against the
 * total capital deployed (purchase price + optional DLD transfer fee).
 */

export interface RoiInput {
  /** Purchase price of the unit (AED). */
  purchasePriceAed: number;
  /** Unit size (sqft) — used only to turn the AED/sqft service charge into AED/yr. */
  sizeSqft: number;
  /** Booking deposit paid up front, as a % of price. */
  downPaymentPct: number;
  /** Installments paid during construction, as a % of price. */
  duringConstructionPct: number;
  /** Payment due at handover, as a % of price. */
  handoverPct: number;
  /** Installments paid after handover, as a % of price. */
  postHandoverPct: number;
  /** How many years the investor holds after handover. */
  holdingYears: number;
  /** Expected gross annual rent (AED). Prefilled from DLD gross yield × price. */
  annualRentAed: number;
  /** Annual service charge (AED per sqft per year) — an assumption, not DLD data. */
  serviceChargePerSqftAed: number;
  /** Expected annual price appreciation (%). Prefilled from DLD, capped 0–12. */
  annualAppreciationPct: number;
  /** Fold the DLD 4% transfer fee into invested capital. */
  includeDldFee: boolean;
  /** Sell at the end of the holding period, realizing the appreciation gain. */
  realizeSaleAtExit: boolean;
}

export interface RoiResult {
  /** Cash out of pocket by the handover milestone (down + during + handover [+ fee]). */
  cashInvestedToHandoverAed: number;
  /** Full capital deployed over the plan (price [+ fee]) — the return-% denominator. */
  totalCapitalAed: number;
  dldFeeAed: number;
  grossAnnualRentAed: number;
  annualServiceChargeAed: number;
  netAnnualRentAed: number;
  grossRentalYieldPct: number;
  netRentalYieldPct: number;
  /** Applied appreciation after clamping to 0–{@link APPRECIATION_CAP_PCT}%. */
  appliedAppreciationPct: number;
  /** Compounded projected price after the holding period. */
  projectedValueAed: number;
  /** Projected capital gain over the holding period (paper gain until sold). */
  capitalAppreciationAed: number;
  /** Net rent collected over the whole holding period (rent held flat). */
  totalNetRentAed: number;
  /** Rent + (realized appreciation) over the holding period. */
  totalReturnAed: number;
  totalReturnPct: number;
  /** Total return % ÷ holding years (simple, non-compounded). */
  annualizedReturnPct: number;
  /** Years for cumulative net rent to repay the invested capital (null if no net rent). */
  rentalPaybackYears: number | null;
}

/** Dubai residential appreciation runs low-single to low-double digits; cap the
 *  user/DLD input the same way yields are capped so no artifact headlines. */
export const APPRECIATION_CAP_PCT = 12;

/** Apartments in Dubai commonly run ~15–20 AED/sqft/yr service charge. */
export const DEFAULT_SERVICE_CHARGE_PER_SQFT = 16;

export const ROI_DEFAULTS: RoiInput = {
  purchasePriceAed: 1_500_000,
  sizeSqft: 850,
  downPaymentPct: 20,
  duringConstructionPct: 40,
  handoverPct: 40,
  postHandoverPct: 0,
  holdingYears: 5,
  annualRentAed: 105_000,
  serviceChargePerSqftAed: DEFAULT_SERVICE_CHARGE_PER_SQFT,
  annualAppreciationPct: 6,
  includeDldFee: true,
  realizeSaleAtExit: true,
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateRoi(input: RoiInput): RoiResult {
  const price = Math.max(0, input.purchasePriceAed);
  const size = Math.max(0, input.sizeSqft);
  const holdingYears = Math.max(0, input.holdingYears);

  const dldFeeAed = input.includeDldFee ? Math.round((price * DLD_FEE_PCT) / 100) : 0;

  const paidToHandoverPct =
    input.downPaymentPct + input.duringConstructionPct + input.handoverPct;
  const cashInvestedToHandoverAed =
    Math.round((price * paidToHandoverPct) / 100) + dldFeeAed;
  const totalCapitalAed = price + dldFeeAed;

  const grossAnnualRentAed = Math.max(0, Math.round(input.annualRentAed));
  const annualServiceChargeAed = Math.round(
    Math.max(0, input.serviceChargePerSqftAed) * size,
  );
  const netAnnualRentAed = grossAnnualRentAed - annualServiceChargeAed;

  const grossRentalYieldPct = price > 0 ? (grossAnnualRentAed / price) * 100 : 0;
  const netRentalYieldPct = price > 0 ? (netAnnualRentAed / price) * 100 : 0;

  const appliedAppreciationPct = clamp(
    input.annualAppreciationPct,
    0,
    APPRECIATION_CAP_PCT,
  );
  const projectedValueAed = Math.round(
    price * Math.pow(1 + appliedAppreciationPct / 100, holdingYears),
  );
  const capitalAppreciationAed = projectedValueAed - price;

  const totalNetRentAed = netAnnualRentAed * holdingYears;
  const realizedAppreciationAed = input.realizeSaleAtExit ? capitalAppreciationAed : 0;
  const totalReturnAed = totalNetRentAed + realizedAppreciationAed;

  const totalReturnPct =
    totalCapitalAed > 0 ? (totalReturnAed / totalCapitalAed) * 100 : 0;
  const annualizedReturnPct = holdingYears > 0 ? totalReturnPct / holdingYears : 0;

  const rentalPaybackYears =
    netAnnualRentAed > 0 ? totalCapitalAed / netAnnualRentAed : null;

  return {
    cashInvestedToHandoverAed,
    totalCapitalAed,
    dldFeeAed,
    grossAnnualRentAed,
    annualServiceChargeAed,
    netAnnualRentAed,
    grossRentalYieldPct,
    netRentalYieldPct,
    appliedAppreciationPct,
    projectedValueAed,
    capitalAppreciationAed,
    totalNetRentAed,
    totalReturnAed,
    totalReturnPct,
    annualizedReturnPct,
    rentalPaybackYears,
  };
}
