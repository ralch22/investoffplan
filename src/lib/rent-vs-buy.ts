export interface RentVsBuyInput {
  propertyPriceAed: number;
  downPaymentPct: number;
  annualMortgageRatePct: number;
  mortgageTermYears: number;
  monthlyRentAed: number;
  annualRentIncreasePct: number;
  annualMaintenancePct: number;
  annualPropertyGrowthPct: number;
  comparisonYears: number;
}

export interface RentVsBuyResult {
  monthlyMortgageAed: number;
  monthlyRentYear1Aed: number;
  totalRentPaidAed: number;
  totalBuyCostAed: number;
  estimatedEquityAed: number;
  netBuyPositionAed: number;
  netRentPositionAed: number;
  breakEvenYear: number | null;
  recommendation: "buy" | "rent" | "neutral";
}

function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const months = termYears * 12;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const downPayment = Math.round(
    (input.propertyPriceAed * input.downPaymentPct) / 100,
  );
  const loanPrincipal = input.propertyPriceAed - downPayment;
  const monthlyMortgage = monthlyPayment(
    loanPrincipal,
    input.annualMortgageRatePct,
    input.mortgageTermYears,
  );

  let totalRent = 0;
  let rent = input.monthlyRentAed;
  for (let year = 0; year < input.comparisonYears; year++) {
    totalRent += rent * 12;
    rent = Math.round(rent * (1 + input.annualRentIncreasePct / 100));
  }

  const mortgageMonths = Math.min(
    input.mortgageTermYears * 12,
    input.comparisonYears * 12,
  );
  const totalMortgagePaid = monthlyMortgage * mortgageMonths;
  const totalMaintenance = Math.round(
    input.propertyPriceAed *
      (input.annualMaintenancePct / 100) *
      input.comparisonYears,
  );
  const totalBuyCost = downPayment + totalMortgagePaid + totalMaintenance;

  const estimatedValue = Math.round(
    input.propertyPriceAed *
      Math.pow(1 + input.annualPropertyGrowthPct / 100, input.comparisonYears),
  );
  const estimatedEquity = estimatedValue - loanPrincipal;
  const netBuyPosition = estimatedEquity - totalBuyCost;
  const netRentPosition = -totalRent;

  let breakEvenYear: number | null = null;
  let cumulativeRent = 0;
  let cumulativeBuy = downPayment;
  let runningRent = input.monthlyRentAed;
  let propertyValue = input.propertyPriceAed;

  for (let year = 1; year <= input.comparisonYears; year++) {
    cumulativeRent += runningRent * 12;
    cumulativeBuy +=
      monthlyMortgage * 12 +
      Math.round(propertyValue * (input.annualMaintenancePct / 100));
    propertyValue = Math.round(
      propertyValue * (1 + input.annualPropertyGrowthPct / 100),
    );
    const buyNet = propertyValue - loanPrincipal - cumulativeBuy;
    const rentNet = -cumulativeRent;
    if (breakEvenYear == null && buyNet >= rentNet) {
      breakEvenYear = year;
    }
    runningRent = Math.round(
      runningRent * (1 + input.annualRentIncreasePct / 100),
    );
  }

  let recommendation: RentVsBuyResult["recommendation"] = "neutral";
  if (netBuyPosition > netRentPosition + 50_000) recommendation = "buy";
  else if (netRentPosition > netBuyPosition + 50_000) recommendation = "rent";

  return {
    monthlyMortgageAed: monthlyMortgage,
    monthlyRentYear1Aed: input.monthlyRentAed,
    totalRentPaidAed: totalRent,
    totalBuyCostAed: totalBuyCost,
    estimatedEquityAed: estimatedEquity,
    netBuyPositionAed: netBuyPosition,
    netRentPositionAed: netRentPosition,
    breakEvenYear,
    recommendation,
  };
}

export const RENT_VS_BUY_DEFAULTS: RentVsBuyInput = {
  propertyPriceAed: 1_500_000,
  downPaymentPct: 20,
  annualMortgageRatePct: 4.5,
  mortgageTermYears: 25,
  monthlyRentAed: 85_000 / 12,
  annualRentIncreasePct: 3,
  annualMaintenancePct: 1,
  annualPropertyGrowthPct: 5,
  comparisonYears: 10,
};