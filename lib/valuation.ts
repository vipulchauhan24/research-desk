// Valuation maths. Pure functions on plain numbers: amounts in ₹ Cr, per-share figures in ₹, rates in percent.
// Nothing here rounds; rounding happens when a value is formatted for display.

export interface CashFlowYear {
  sales: number;
  ebitda: number;
  depreciation: number;
  interest: number;
  capex: number;
  wcChange: number;
  netBorrowing: number;
}

// A year whose inputs may still be missing while the user is typing.
export type LooseCashFlowYear = { [K in keyof CashFlowYear]: number | null };

export interface CashFlowSeries {
  taxOnEbit: (number | null)[];
  fcff: (number | null)[];
  fcfe: (number | null)[];
}

// No tax is paid on an operating loss, so a negative EBIT gives zero rather than a refund.
export function taxOnEbit(ebitda: number, depreciation: number, taxRatePct: number): number {
  return Math.max(0, ebitda - depreciation) * (taxRatePct / 100);
}

// Free cash flow to the firm: EBITDA less tax on EBIT, capex and the build-up in working capital.
export function fcff(year: CashFlowYear, taxRatePct: number): number {
  return year.ebitda - taxOnEbit(year.ebitda, year.depreciation, taxRatePct) - year.capex - year.wcChange;
}

// Free cash flow to equity: what is left for shareholders after post-tax interest, plus new borrowing.
// Net borrowing in the terminal year is assumed to keep growing with the cash flow.
export function fcfe(year: CashFlowYear, taxRatePct: number): number {
  return fcff(year, taxRatePct) - year.interest * (1 - taxRatePct / 100) + year.netBorrowing;
}

function hasAll(year: LooseCashFlowYear): year is CashFlowYear {
  return Object.values(year).every((value) => value !== null);
}

export function cashFlowSeries(years: LooseCashFlowYear[], taxRatePct: number | null): CashFlowSeries {
  // A flow needs every input of its year plus the tax rate; until then it is null rather than a partial figure.
  const flow = (compute: (year: CashFlowYear, taxRatePct: number) => number) => (year: LooseCashFlowYear) =>
    taxRatePct !== null && hasAll(year) ? compute(year, taxRatePct) : null;

  return {
    taxOnEbit: years.map((year) =>
      year.ebitda !== null && year.depreciation !== null && taxRatePct !== null
        ? taxOnEbit(year.ebitda, year.depreciation, taxRatePct)
        : null,
    ),
    fcff: years.map(flow(fcff)),
    fcfe: years.map(flow(fcfe)),
  };
}

// Cash received at the end of year `year` is worth less today by (1 + rate) per year waited.
export function discountFactor(ratePct: number, year: number): number {
  return 1 / Math.pow(1 + ratePct / 100, year);
}

export function presentValue(amount: number, ratePct: number, years: number): number {
  return amount * discountFactor(ratePct, years);
}

export interface DcfResult {
  discountFactors: number[];
  presentValues: number[];
  terminalValue: number;
  terminalPresentValue: number;
  // Sum of the discounted forecast flows plus the discounted terminal value.
  total: number;
}

// Gordon-growth terminal value on the last forecast flow. It only exists while the discount rate exceeds the
// terminal growth, otherwise the sum never converges; callers get null and show why.
export function dcf(flows: number[], ratePct: number, terminalGrowthPct: number): DcfResult | null {
  if (flows.length === 0 || ratePct <= terminalGrowthPct) return null;

  const discountFactors = flows.map((_, index) => discountFactor(ratePct, index + 1));
  const presentValues = flows.map((flow, index) => flow * discountFactors[index]);
  const last = flows.length - 1;
  const terminalValue = (flows[last] * (1 + terminalGrowthPct / 100)) / ((ratePct - terminalGrowthPct) / 100);
  const terminalPresentValue = terminalValue * discountFactors[last];
  const total = presentValues.reduce((sum, value) => sum + value, 0) + terminalPresentValue;

  return { discountFactors, presentValues, terminalValue, terminalPresentValue, total };
}

// ₹ Cr of value spread over Cr of shares is ₹ per share.
export function perShare(valueCr: number, sharesCr: number): number {
  return valueCr / sharesCr;
}

export function belowMarginOfSafety(value: number, marginOfSafetyPct: number): number {
  return value * (1 - marginOfSafetyPct / 100);
}

export function targetPriceFromPe(eps: number, targetPe: number): number {
  return eps * targetPe;
}

export function targetPriceFromEvEbitda(ebitdaCr: number, multiple: number, netDebtCr: number, sharesCr: number): number {
  return perShare(ebitdaCr * multiple - netDebtCr, sharesCr);
}

export function peRatio(price: number, eps: number): number {
  return price / eps;
}

// PE divided by growth in percent points: 1.0 means the multiple equals the growth rate.
export function pegRatio(pe: number, growthPct: number): number {
  return pe / growthPct;
}

export function earningsYield(eps: number, price: number): number {
  return (eps / price) * 100;
}

const REVERSE_DCF_LOW_GROWTH = -50;
const REVERSE_DCF_HIGH_GROWTH = 100;
const REVERSE_DCF_ITERATIONS = 80;

export interface ReverseDcfInput {
  price: number;
  baseFcffCr: number;
  netDebtCr: number;
  sharesCr: number;
  waccPct: number;
  terminalGrowthPct: number;
  years: number;
}

function valuePerShare(input: ReverseDcfInput, growthPct: number): number {
  const flows = Array.from({ length: input.years }, (_, index) => input.baseFcffCr * Math.pow(1 + growthPct / 100, index + 1));
  const result = dcf(flows, input.waccPct, input.terminalGrowthPct);
  return result ? perShare(result.total - input.netDebtCr, input.sharesCr) : Number.NaN;
}

// The yearly FCFF growth over the forecast that makes the DCF equal the current price. Value rises with growth
// for a positive base flow, so bisection converges; null when no growth in the search range reaches the price.
export function impliedGrowth(input: ReverseDcfInput): number | null {
  if (input.baseFcffCr <= 0 || input.years < 1 || input.waccPct <= input.terminalGrowthPct) return null;

  let low = REVERSE_DCF_LOW_GROWTH;
  let high = REVERSE_DCF_HIGH_GROWTH;
  if (valuePerShare(input, low) > input.price || valuePerShare(input, high) < input.price) return null;

  for (let step = 0; step < REVERSE_DCF_ITERATIONS; step += 1) {
    const mid = (low + high) / 2;
    if (valuePerShare(input, mid) < input.price) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// What to pay today to earn `cagrPct` a year if the stock reaches `exitPrice` in `years` years.
export function buyBelowPrice(exitPrice: number, cagrPct: number, years: number): number {
  return exitPrice / Math.pow(1 + cagrPct / 100, years);
}
