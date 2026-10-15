import { z } from "zod";
import { currentFiscalYear } from "@/lib/dates";
import { paiseToCrore, paiseToRupees } from "@/lib/money";
import { buyBelowPrice, type LooseCashFlowYear } from "@/lib/valuation";
import { draftToLoose, fieldSchema, storedToDraft } from "@/lib/valuation-fields";

// The Base-case tables the DCF methods (Table 2) and the buying-price table (Table 3) read from. Until Scenarios
// exists they are typed in by hand; they are stored under their own keys in valuation_inputs.
export const CASH_FLOWS_KEY = "cash-flows";
export const EXIT_PRICES_KEY = "exit-prices";

export const MAX_FORECAST_YEARS = 10;
const DEFAULT_FORECAST_YEARS = 5;
const DEFAULT_TAX_RATE = "25";

// ---- Table 2 · Cash-flow inputs -------------------------------------------------------------------------------

export const CASH_FLOW_KEYS = [
  "sales",
  "ebitda",
  "depreciation",
  "interest",
  "capex",
  "wcChange",
  "netBorrowing",
] as const;
export type CashFlowKey = (typeof CASH_FLOW_KEYS)[number];

// Interest and net borrowing only matter for the FCFE method. They default to 0 so FCFF users never have to touch them.
export const CASH_FLOW_ROWS: readonly { key: CashFlowKey; label: string; defaultValue: string }[] = [
  { key: "sales", label: "Sales", defaultValue: "" },
  { key: "ebitda", label: "EBITDA", defaultValue: "" },
  { key: "depreciation", label: "Depreciation", defaultValue: "" },
  { key: "interest", label: "Interest", defaultValue: "0" },
  { key: "capex", label: "Capex", defaultValue: "" },
  { key: "wcChange", label: "Change in working capital", defaultValue: "" },
  { key: "netBorrowing", label: "Net borrowing", defaultValue: "0" },
];

const croreCell = fieldSchema("crore");

// One schema per cell, so a grid cell validates against just its own column.
export const cashFlowYearSchema = z.object({
  id: z.string(),
  sales: croreCell,
  ebitda: croreCell,
  depreciation: croreCell,
  interest: croreCell,
  capex: croreCell,
  wcChange: croreCell,
  netBorrowing: croreCell,
});

export const cashFlowsFormSchema = z.object({
  firstFiscalYear: z
    .string()
    .trim()
    .regex(/^20\d{2}$/, "Enter a fiscal year like 2027")
    .transform(Number),
  taxRate: fieldSchema("percent").pipe(z.number().min(0, "Use 0 to 100").max(100, "Use 0 to 100")),
  years: z
    .array(cashFlowYearSchema)
    .min(1, "Add at least one year")
    .max(MAX_FORECAST_YEARS, `Use at most ${MAX_FORECAST_YEARS} years`),
});

export interface CashFlowYearDraft extends Record<CashFlowKey, string> {
  // Stable React key, so adding or removing a year doesn't shuffle the other columns' state.
  id: string;
}

export interface CashFlowsDraft {
  firstFiscalYear: string;
  taxRate: string;
  years: CashFlowYearDraft[];
}

export const cashFlowsStoredSchema = z.object({
  firstFiscalYear: z.number().int(),
  taxRate: z.number(),
  years: z
    .array(
      z.object({
        sales: z.number().int(),
        ebitda: z.number().int(),
        depreciation: z.number().int(),
        interest: z.number().int(),
        capex: z.number().int(),
        wcChange: z.number().int(),
        netBorrowing: z.number().int(),
      }),
    )
    .min(1)
    .max(MAX_FORECAST_YEARS),
});

// Amounts inside are integer paise (see valuation_inputs).
export type StoredCashFlows = z.infer<typeof cashFlowsStoredSchema>;

export function newCashFlowYear(): CashFlowYearDraft {
  const values = Object.fromEntries(CASH_FLOW_ROWS.map((row) => [row.key, row.defaultValue])) as Record<CashFlowKey, string>;
  return { id: crypto.randomUUID(), ...values };
}

export function cashFlowsToDraft(stored: StoredCashFlows | null): CashFlowsDraft {
  if (!stored) {
    return {
      firstFiscalYear: String(currentFiscalYear()),
      taxRate: DEFAULT_TAX_RATE,
      years: Array.from({ length: DEFAULT_FORECAST_YEARS }, newCashFlowYear),
    };
  }
  return {
    firstFiscalYear: String(stored.firstFiscalYear),
    taxRate: String(stored.taxRate),
    years: stored.years.map((year) => ({
      id: crypto.randomUUID(),
      ...(Object.fromEntries(CASH_FLOW_KEYS.map((key) => [key, storedToDraft("crore", year[key])])) as Record<CashFlowKey, string>),
    })),
  };
}

// Form output (ids dropped) -> what is saved.
export function cashFlowsToStored(parsed: z.output<typeof cashFlowsFormSchema>): StoredCashFlows {
  return {
    firstFiscalYear: parsed.firstFiscalYear,
    taxRate: parsed.taxRate,
    years: parsed.years.map((year) => ({
      sales: year.sales,
      ebitda: year.ebitda,
      depreciation: year.depreciation,
      interest: year.interest,
      capex: year.capex,
      wcChange: year.wcChange,
      netBorrowing: year.netBorrowing,
    })),
  };
}

// ₹ Cr figures for the maths. Missing or half-typed cells come back as null.
export function storedCashFlowYears(stored: StoredCashFlows): LooseCashFlowYear[] {
  return stored.years.map(
    (year) => Object.fromEntries(CASH_FLOW_KEYS.map((key) => [key, paiseToCrore(year[key])])) as LooseCashFlowYear,
  );
}

export function draftCashFlowYears(years: CashFlowYearDraft[]): LooseCashFlowYear[] {
  return years.map((year) => {
    const entries = CASH_FLOW_KEYS.map((key) => {
      const paise = draftToLoose("crore", year[key]);
      return [key, paise === null ? null : paiseToCrore(paise)] as const;
    });
    return Object.fromEntries(entries) as LooseCashFlowYear;
  });
}

// ---- Table 3 · Buying price for expected CAGR ---------------------------------------------------------------

export const EXIT_HORIZONS = [3, 5, 7] as const;
export type ExitHorizon = (typeof EXIT_HORIZONS)[number];
export const TARGET_CAGRS = [12, 15, 18, 20, 25] as const;
// The column compared with today's price.
export const COMPARISON_HORIZON: ExitHorizon = 5;

export const exitPricesFormSchema = z.object({
  y3: fieldSchema("rupees"),
  y5: fieldSchema("rupees"),
  y7: fieldSchema("rupees"),
});

export type ExitPricesDraft = Record<`y${ExitHorizon}`, string>;
export const exitPricesStoredSchema = z.object({ y3: z.number().int(), y5: z.number().int(), y7: z.number().int() });
// Base-case exit prices in integer paise.
export type StoredExitPrices = z.infer<typeof exitPricesStoredSchema>;

export function exitPricesToDraft(stored: StoredExitPrices | null): ExitPricesDraft {
  return {
    y3: stored ? storedToDraft("rupees", stored.y3) : "",
    y5: stored ? storedToDraft("rupees", stored.y5) : "",
    y7: stored ? storedToDraft("rupees", stored.y7) : "",
  };
}

// Exit prices in ₹ as far as they are filled in.
export function draftExitPrices(draft: ExitPricesDraft): Record<ExitHorizon, number | null> {
  const rupees = (text: string) => {
    const paise = draftToLoose("rupees", text);
    return paise === null ? null : paiseToRupees(paise);
  };
  return { 3: rupees(draft.y3), 5: rupees(draft.y5), 7: rupees(draft.y7) };
}

export interface BuyingPriceRow {
  cagr: number;
  // ₹ to pay today for each horizon; null until that exit price is entered.
  buyBelow: Record<ExitHorizon, number | null>;
  // How far the 5-year buy-below price sits from the current price, in percent.
  versusPricePct: number | null;
}

export function buyingPriceRows(
  exitPrices: Record<ExitHorizon, number | null>,
  currentPriceRupees: number | null,
): BuyingPriceRow[] {
  return TARGET_CAGRS.map((cagr) => {
    const buyBelow = Object.fromEntries(
      EXIT_HORIZONS.map((years) => {
        const exit = exitPrices[years];
        return [years, exit === null ? null : buyBelowPrice(exit, cagr, years)];
      }),
    ) as Record<ExitHorizon, number | null>;
    const comparison = buyBelow[COMPARISON_HORIZON];
    const versusPricePct = comparison !== null && currentPriceRupees ? (comparison / currentPriceRupees - 1) * 100 : null;
    return { cagr, buyBelow, versusPricePct };
  });
}
