import { formatNumber, PLACEHOLDER } from "@/lib/format";
import { cashFlowSeries, dcf, type LooseCashFlowYear } from "@/lib/valuation";

export type DcfKind = "fcff" | "fcfe";

export interface DiscountAssumptions {
  ratePct: number;
  terminalGrowthPct: number;
}

// A computed row of Table 2 as display strings: one cell per forecast year plus the terminal column.
export interface CalcRow {
  id: string;
  label: string;
  cells: string[];
  terminal: string;
}

const cell = (value: number | null | undefined, decimals = 1) =>
  value === null || value === undefined ? PLACEHOLDER : formatNumber(value, decimals);

// Computed rows under the input rows of Table 2. `discount` comes from the method's saved inputs; without it
// (or while a cash flow is still missing) the discounting rows show a dash rather than a partial sum.
export function cashFlowCalcRows(
  kind: DcfKind,
  years: LooseCashFlowYear[],
  taxRatePct: number | null,
  discount: DiscountAssumptions | null,
): CalcRow[] {
  const series = cashFlowSeries(years, taxRatePct);
  const flows = kind === "fcff" ? series.fcff : series.fcfe;
  const complete = flows.every((flow): flow is number => flow !== null);
  const result = complete && discount ? dcf(flows, discount.ratePct, discount.terminalGrowthPct) : null;
  const last = years.length - 1;

  const flowRow: CalcRow = {
    id: kind,
    label: kind === "fcff" ? "FCFF" : "FCFE",
    cells: flows.map((flow) => cell(flow)),
    terminal: cell(result?.terminalValue),
  };
  const discountRows: CalcRow[] = [
    {
      id: "discount-factor",
      label: "Discount factor",
      cells: years.map((_, index) => cell(result?.discountFactors[index], 3)),
      terminal: cell(result?.discountFactors[last], 3),
    },
    {
      id: "present-value",
      label: "Present value",
      cells: years.map((_, index) => cell(result?.presentValues[index])),
      terminal: cell(result?.terminalPresentValue),
    },
  ];

  if (kind === "fcfe") return [flowRow, ...discountRows];
  const taxRow: CalcRow = {
    id: "tax-on-ebit",
    label: "Tax on EBIT",
    cells: series.taxOnEbit.map((tax) => cell(tax)),
    terminal: PLACEHOLDER,
  };
  return [taxRow, flowRow, ...discountRows];
}
