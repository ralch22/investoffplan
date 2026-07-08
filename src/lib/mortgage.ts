export interface MortgageInput {
  propertyPriceAed: number;
  downPaymentPct: number;
  annualRatePct: number;
  termYears: number;
  /** Include DLD transfer fee (4%) + typical fixed fees in cash-to-close. */
  includeFees: boolean;
}

export interface MortgageResult {
  downPaymentAed: number;
  loanAmountAed: number;
  monthlyPaymentAed: number;
  totalInterestAed: number;
  totalRepaymentAed: number;
  dldFeeAed: number;
  estimatedFixedFeesAed: number;
  cashToCloseAed: number;
  /** Payment at rate + 2% — a common affordability stress test. */
  stressedMonthlyPaymentAed: number;
}

/** UAE norms: max 25-year term; expat minimum down payment 20% under AED 5M. */
export const MAX_TERM_YEARS = 25;
export const MIN_DOWN_PAYMENT_PCT = 20;
export const DLD_FEE_PCT = 4;
/** Trustee, valuation, mortgage registration (0.25% capped-ish) — rough fixed allowance. */
const FIXED_FEES_AED = 8_000;

export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const months = termYears * 12;
  if (months <= 0) return 0;
  if (monthlyRate === 0) return Math.round(principal / months);
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const downPaymentAed = Math.round(
    (input.propertyPriceAed * input.downPaymentPct) / 100,
  );
  const loanAmountAed = Math.max(0, input.propertyPriceAed - downPaymentAed);
  const termYears = Math.min(MAX_TERM_YEARS, Math.max(1, input.termYears));
  const monthly = monthlyPayment(loanAmountAed, input.annualRatePct, termYears);
  const totalRepaymentAed = monthly * termYears * 12;
  const dldFeeAed = input.includeFees
    ? Math.round((input.propertyPriceAed * DLD_FEE_PCT) / 100)
    : 0;
  const estimatedFixedFeesAed = input.includeFees ? FIXED_FEES_AED : 0;

  return {
    downPaymentAed,
    loanAmountAed,
    monthlyPaymentAed: monthly,
    totalInterestAed: Math.max(0, totalRepaymentAed - loanAmountAed),
    totalRepaymentAed,
    dldFeeAed,
    estimatedFixedFeesAed,
    cashToCloseAed: downPaymentAed + dldFeeAed + estimatedFixedFeesAed,
    stressedMonthlyPaymentAed: monthlyPayment(
      loanAmountAed,
      input.annualRatePct + 2,
      termYears,
    ),
  };
}
