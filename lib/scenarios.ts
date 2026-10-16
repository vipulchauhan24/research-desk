import { formatFiscalYear } from "@/lib/format";

// Scenario maths. Pure functions on plain numbers: amounts in ₹ Cr, per-share figures in ₹, rates in percent.
// Nothing here rounds; rounding happens when a value is formatted for display.

export const CASE_KEYS = ["bear", "base", "bull"] as const;
export type CaseKey = (typeof CASE_KEYS)[number];
export const CASE_LABEL: Record<CaseKey, string> = { bear: "Bear", base: "Base", bull: "Bull" };

export const GRID_MODES = ["quarterly", "yearly"] as const;
export type GridMode = (typeof GRID_MODES)[number];
export const MODE_LABEL: Record<GridMode, string> = { quarterly: "Quarterly", yearly: "Yearly" };

export const SCENARIO_METHODS = ["margin-profit-growth", "ev-ebitda", "pe"] as const;
export type ScenarioMethod = (typeof SCENARIO_METHODS)[number];
export const METHOD_LABEL: Record<ScenarioMethod, string> = {
  "margin-profit-growth": "Margin and profit growth",
  "ev-ebitda": "EV/EBITDA",
  pe: "PE",
};

export const MAX_PERIODS = 10;

// A quarter's earnings are annualised (×4) before a yearly multiple is applied to them.
const ANNUALISATION: Record<GridMode, number> = { yearly: 1, quarterly: 4 };

// Every number a period can carry. Which ones matter depends on the method (see scenarios-grid).
export const PERIOD_FIELDS = [
  "sales",
  "growth",
  "opm",
  "otherIncome",
  "interest",
  "depreciation",
  "taxRate",
  "pat",
  "patGrowth",
  "shares",
  "netDebt",
  "pe",
  "evMultiple",
] as const;
export type PeriodField = (typeof PERIOD_FIELDS)[number];

// null = not entered yet. A scenario is filled in over time, so every number may be missing.
export type PeriodInputs = Record<PeriodField, number | null>;

export interface ComputedPeriod {
  sales: number | null;
  growth: number | null;
  opProfit: number | null;
  pbt: number | null;
  pat: number | null;
  patGrowth: number | null;
  eps: number | null;
  ev: number | null;
  equity: number | null;
  marketCap: number | null;
  price: number | null;
}

const EMPTY_PERIOD: ComputedPeriod = {
  sales: null,
  growth: null,
  opProfit: null,
  pbt: null,
  pat: null,
  patGrowth: null,
  eps: null,
  ev: null,
  equity: null,
  marketCap: null,
  price: null,
};

type Num = number | null;

function percentChange(from: Num, to: Num): Num {
  // A change from zero or from a loss has no meaningful percentage.
  return from !== null && to !== null && from > 0 ? (to / from - 1) * 100 : null;
}

function grow(from: Num, ratePct: Num): Num {
  return from !== null && ratePct !== null ? from * (1 + ratePct / 100) : null;
}

// PBT is taxed only when it is a profit; a loss gets no refund.
function afterTax(pbt: Num, taxRatePct: Num): Num {
  return pbt !== null && taxRatePct !== null ? pbt - Math.max(0, pbt) * (taxRatePct / 100) : null;
}

function perShare(amount: Num, shares: Num): Num {
  return amount !== null && shares !== null && shares > 0 ? amount / shares : null;
}

function computePeriod(
  method: ScenarioMethod,
  annualisation: number,
  input: PeriodInputs,
  previous: ComputedPeriod,
  isActual: boolean,
): ComputedPeriod {
  const sales = isActual ? input.sales : grow(previous.sales, input.growth);
  const growth = isActual ? percentChange(previous.sales, sales) : input.growth;
  const opProfit = sales !== null && input.opm !== null ? (sales * input.opm) / 100 : null;
  const base = { ...EMPTY_PERIOD, sales, growth, opProfit };

  if (method === "ev-ebitda") {
    const ev = opProfit !== null && input.evMultiple !== null ? opProfit * annualisation * input.evMultiple : null;
    const equity = ev !== null && input.netDebt !== null ? ev - input.netDebt : null;
    return { ...base, ev, equity, price: perShare(equity, input.shares) };
  }

  let pbt: Num = null;
  let pat: Num;
  let patGrowth: Num;
  if (method === "margin-profit-growth") {
    pbt =
      opProfit !== null && input.otherIncome !== null && input.interest !== null && input.depreciation !== null
        ? opProfit + input.otherIncome - input.interest - input.depreciation
        : null;
    pat = afterTax(pbt, input.taxRate);
    patGrowth = percentChange(previous.pat, pat);
  } else {
    pat = isActual ? input.pat : grow(previous.pat, input.patGrowth);
    patGrowth = isActual ? percentChange(previous.pat, pat) : input.patGrowth;
  }

  const eps = perShare(pat, input.shares);
  const price = eps !== null && input.pe !== null ? eps * annualisation * input.pe : null;
  return {
    ...base,
    pbt,
    pat,
    patGrowth,
    eps,
    price,
    marketCap: price !== null && input.shares !== null ? price * input.shares : null,
  };
}

// Actual periods are facts, shared by all three cases: they are entered once, under Base, and Bear and Bull read
// them from there. Only the estimates differ per case.
export function effectiveInputs(
  caseKey: CaseKey,
  cases: Record<CaseKey, PeriodInputs[]>,
  actualCount: number,
): PeriodInputs[] {
  return cases[caseKey].map((period, index) => (index < actualCount ? cases.base[index] ?? period : period));
}

export function computeCase(
  method: ScenarioMethod,
  mode: GridMode,
  inputs: PeriodInputs[],
  actualCount: number,
): ComputedPeriod[] {
  const computed: ComputedPeriod[] = [];
  inputs.forEach((input, index) => {
    computed.push(computePeriod(method, ANNUALISATION[mode], input, computed[index - 1] ?? EMPTY_PERIOD, index < actualCount));
  });
  return computed;
}

// ---- Periods ---------------------------------------------------------------------------------------------------

export interface PeriodRef {
  fiscalYear: number;
  // 1–4 for quarterly grids; null for yearly.
  quarter: number | null;
}

export function periodAt(mode: GridMode, startYear: number, startQuarter: number, index: number): PeriodRef {
  if (mode === "yearly") return { fiscalYear: startYear + index, quarter: null };
  const quartersSinceStart = startQuarter - 1 + index;
  return { fiscalYear: startYear + Math.floor(quartersSinceStart / 4), quarter: (quartersSinceStart % 4) + 1 };
}

// "FY25 (A)", "FY27 (E)", "Q3 FY26 (A)": actuals are reported, estimates are ours.
export function periodLabel(ref: PeriodRef, isActual: boolean): string {
  const name = ref.quarter === null ? formatFiscalYear(ref.fiscalYear) : `Q${ref.quarter} ${formatFiscalYear(ref.fiscalYear)}`;
  return `${name} (${isActual ? "A" : "E"})`;
}

// ---- Probabilities and the summary ------------------------------------------------------------------------------

export type Probabilities = Record<CaseKey, number>;

// Setting one probability re-splits the remainder across the other two in proportion to what they had, so the
// total stays 100. If both were zero the remainder is split evenly.
export function rebalanceProbabilities(current: Probabilities, changed: CaseKey, value: number): Probabilities {
  const set = Math.min(100, Math.max(0, Math.round(value)));
  const [first, second] = CASE_KEYS.filter((key) => key !== changed);
  const remainder = 100 - set;
  const othersTotal = current[first] + current[second];
  const firstShare = othersTotal === 0 ? Math.round(remainder / 2) : Math.round((remainder * current[first]) / othersTotal);
  return { ...current, [changed]: set, [first]: firstShare, [second]: remainder - firstShare };
}

export function probabilityTotal(probabilities: Probabilities): number {
  return CASE_KEYS.reduce((sum, key) => sum + probabilities[key], 0);
}

// The targets weighted by how likely each case is. Needs all three targets.
export function weightedTarget(targets: Record<CaseKey, Num>, probabilities: Probabilities): Num {
  if (CASE_KEYS.some((key) => targets[key] === null)) return null;
  return CASE_KEYS.reduce((sum, key) => sum + (targets[key] as number) * probabilities[key], 0) / 100;
}

export function expectedReturnPct(target: Num, currentPrice: Num): Num {
  return target !== null && currentPrice !== null && currentPrice > 0 ? (target / currentPrice - 1) * 100 : null;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// Years from `now` to the end of fiscal year `fiscalYear` (31 March of that year); null once it has passed.
export function yearsToFiscalYearEnd(fiscalYear: number, now = new Date()): Num {
  const years = (new Date(fiscalYear, 2, 31).getTime() - now.getTime()) / MS_PER_YEAR;
  return years > 0 ? years : null;
}
