import { formatNumber, formatPercent, PLACEHOLDER } from "@/lib/format";
import type { ComputedPeriod, PeriodField, PeriodInputs, ScenarioMethod } from "@/lib/scenarios";

export interface GridRow {
  id: string;
  label: string;
  // The input this row edits, if any, and where it is typed: for reported periods, estimates, or both.
  // Where it isn't typed, the cell shows the computed value instead.
  field?: PeriodField;
  input?: "actual" | "estimate" | "always";
  // The cell as text: from the computed period, or for rows that are always typed, from what was entered.
  text: (computed: ComputedPeriod, input: PeriodInputs) => string;
}

type Num = number | null;
const show = (value: Num, format: (value: number) => string) => (value === null ? PLACEHOLDER : format(value));

const money = (value: Num) => show(value, (v) => formatNumber(v, 1));
const whole = (value: Num) => show(value, (v) => formatNumber(v, 0));
const twoDp = (value: Num) => show(value, (v) => formatNumber(v, 2));
const percent = (value: Num) => show(value, formatPercent);
const multiple = (value: Num) => show(value, (v) => `${formatNumber(v, 1)}x`);

const sales: GridRow = { id: "sales", label: "Sales", field: "sales", input: "actual", text: (c) => money(c.sales) };
const growth: GridRow = { id: "growth", label: "Sales growth %", field: "growth", input: "estimate", text: (c) => percent(c.growth) };
const opm: GridRow = { id: "opm", label: "OPM %", field: "opm", input: "always", text: (_c, i) => percent(i.opm) };
const shares: GridRow = { id: "shares", label: "Shares (Cr)", field: "shares", input: "always", text: (_c, i) => twoDp(i.shares) };
const pe: GridRow = { id: "pe", label: "PE (x)", field: "pe", input: "always", text: (_c, i) => multiple(i.pe) };
const eps: GridRow = { id: "eps", label: "EPS (₹)", text: (c) => twoDp(c.eps) };
const price: GridRow = { id: "price", label: "Share price (₹)", text: (c) => whole(c.price) };
const marketCap: GridRow = { id: "market-cap", label: "Market cap (₹ Cr)", text: (c) => whole(c.marketCap) };

// The rows each estimation method works from. Rows without a field are computed and read-only.
const ROWS: Record<ScenarioMethod, GridRow[]> = {
  "margin-profit-growth": [
    sales,
    growth,
    opm,
    { id: "op-profit", label: "Operating profit", text: (c) => money(c.opProfit) },
    { id: "other-income", label: "Other income", field: "otherIncome", input: "always", text: (_c, i) => money(i.otherIncome) },
    { id: "interest", label: "Interest", field: "interest", input: "always", text: (_c, i) => money(i.interest) },
    { id: "depreciation", label: "Depreciation", field: "depreciation", input: "always", text: (_c, i) => money(i.depreciation) },
    { id: "pbt", label: "PBT", text: (c) => money(c.pbt) },
    { id: "tax", label: "Tax %", field: "taxRate", input: "always", text: (_c, i) => percent(i.taxRate) },
    { id: "pat", label: "Net profit", text: (c) => money(c.pat) },
    { id: "pat-growth", label: "PAT growth %", text: (c) => percent(c.patGrowth) },
    shares,
    eps,
    pe,
    marketCap,
    price,
  ],
  "ev-ebitda": [
    sales,
    growth,
    opm,
    { id: "ebitda", label: "Operating profit (EBITDA)", text: (c) => money(c.opProfit) },
    { id: "ev-multiple", label: "EV/EBITDA (x)", field: "evMultiple", input: "always", text: (_c, i) => multiple(i.evMultiple) },
    { id: "ev", label: "Enterprise value (₹ Cr)", text: (c) => whole(c.ev) },
    { id: "net-debt", label: "Net debt", field: "netDebt", input: "always", text: (_c, i) => money(i.netDebt) },
    { id: "equity", label: "Equity value (₹ Cr)", text: (c) => whole(c.equity) },
    shares,
    price,
  ],
  pe: [
    { id: "pat", label: "Net profit", field: "pat", input: "actual", text: (c) => money(c.pat) },
    { id: "pat-growth", label: "PAT growth %", field: "patGrowth", input: "estimate", text: (c) => percent(c.patGrowth) },
    shares,
    eps,
    pe,
    marketCap,
    price,
  ],
};

export function gridRows(method: ScenarioMethod): GridRow[] {
  return ROWS[method];
}

// Whether the cell for this row is typed (true) or computed (false) in a reported or estimate period.
export function isTyped(row: GridRow, isActual: boolean): boolean {
  if (!row.field || !row.input) return false;
  return row.input === "always" || (row.input === "actual") === isActual;
}
