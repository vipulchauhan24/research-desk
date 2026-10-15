import { z } from "zod";
import {
  formatCrore,
  formatMultiple,
  formatNumber,
  formatPercent,
  formatRupees,
  PLACEHOLDER,
} from "@/lib/format";
import { paiseToCrore, paiseToRupees } from "@/lib/money";
import {
  belowMarginOfSafety,
  cashFlowSeries,
  dcf,
  earningsYield,
  impliedGrowth,
  pegRatio,
  peRatio,
  perShare,
  presentValue,
  targetPriceFromEvEbitda,
  targetPriceFromPe,
} from "@/lib/valuation";
import { storedCashFlowYears, type StoredCashFlows } from "@/lib/valuation-base-case";
import { draftToLoose, fieldSchema, storedToDraft, type FieldKind } from "@/lib/valuation-fields";

export interface FieldSpec {
  key: string;
  // Units go in the label ("Net debt (₹ Cr)") because the inputs carry no suffix.
  label: string;
  kind: FieldKind;
  // crore only: reject zero and negatives.
  positive?: boolean;
  defaultValue?: string;
}

export interface MethodSpec {
  id: MethodId;
  label: string;
  title: string;
  // Heading of the result card.
  resultLabel: string;
  fields: readonly FieldSpec[];
  // Methods that discount a perpetuity need rate > growth.
  discount?: { rateKey: string; growthKey: string };
  // Shows Table 2 (the cash-flow inputs) under the method.
  usesCashFlows?: boolean;
}

export const METHOD_IDS = ["dcf-fcff", "dcf-fcfe", "pe", "ev-ebitda", "peg", "earnings-yield", "reverse-dcf"] as const;
export type MethodId = (typeof METHOD_IDS)[number];

const SHARES: FieldSpec = { key: "shares", label: "Shares (Cr)", kind: "shares" };
const NET_DEBT: FieldSpec = { key: "netDebt", label: "Net debt (₹ Cr)", kind: "crore" };
const TERMINAL_GROWTH: FieldSpec = { key: "terminalGrowth", label: "Terminal growth (%)", kind: "percent", defaultValue: "5" };
const MARGIN_OF_SAFETY: FieldSpec = { key: "marginOfSafety", label: "Margin of safety (%)", kind: "percent", defaultValue: "20" };

// The seven methods from the design, in tab order. The forecast length of the DCFs comes from Table 2, not a field.
export const METHODS: readonly MethodSpec[] = [
  {
    id: "dcf-fcff",
    label: "DCF (FCFF)",
    title: "DCF on free cash flow to firm",
    resultLabel: "Intrinsic value per share",
    fields: [{ key: "wacc", label: "WACC (%)", kind: "percent", defaultValue: "12" }, TERMINAL_GROWTH, NET_DEBT, SHARES, MARGIN_OF_SAFETY],
    discount: { rateKey: "wacc", growthKey: "terminalGrowth" },
    usesCashFlows: true,
  },
  {
    id: "dcf-fcfe",
    label: "DCF (FCFE)",
    title: "DCF on free cash flow to equity",
    resultLabel: "Intrinsic value per share",
    fields: [{ key: "costOfEquity", label: "Cost of equity (%)", kind: "percent", defaultValue: "14" }, TERMINAL_GROWTH, SHARES, MARGIN_OF_SAFETY],
    discount: { rateKey: "costOfEquity", growthKey: "terminalGrowth" },
    usesCashFlows: true,
  },
  {
    id: "pe",
    label: "PE",
    title: "Target price from earnings multiple",
    resultLabel: "Target price",
    fields: [
      { key: "exitEps", label: "Exit EPS (₹)", kind: "rupees" },
      { key: "targetPe", label: "Target PE (×)", kind: "multiple", defaultValue: "26" },
      { key: "discountRate", label: "Discount rate (%)", kind: "percent", defaultValue: "12" },
      { key: "yearsToExit", label: "Years to exit", kind: "years", defaultValue: "2" },
    ],
  },
  {
    id: "ev-ebitda",
    label: "EV/EBITDA",
    title: "Target price from EV/EBITDA",
    resultLabel: "Target price",
    fields: [
      { key: "ebitda", label: "Exit EBITDA (₹ Cr)", kind: "crore", positive: true },
      { key: "targetMultiple", label: "Target EV/EBITDA (×)", kind: "multiple", defaultValue: "11" },
      NET_DEBT,
      SHARES,
    ],
  },
  {
    id: "peg",
    label: "PEG",
    title: "PE relative to growth",
    resultLabel: "PEG",
    fields: [
      { key: "eps", label: "EPS, next year (₹)", kind: "rupees" },
      { key: "epsGrowth", label: "EPS growth, yearly (%)", kind: "percent" },
      { key: "fairPeg", label: "Fair PEG (×)", kind: "multiple", defaultValue: "1" },
    ],
  },
  {
    id: "earnings-yield",
    label: "Earnings yield",
    title: "Earnings yield vs risk-free rate",
    resultLabel: "Earnings yield",
    fields: [
      { key: "eps", label: "EPS, next year (₹)", kind: "rupees" },
      { key: "riskFreeRate", label: "Risk-free rate (%)", kind: "percent", defaultValue: "7.1" },
      { key: "requiredSpread", label: "Required spread (%)", kind: "percent", defaultValue: "3" },
    ],
  },
  {
    id: "reverse-dcf",
    label: "Reverse DCF",
    title: "Growth implied by the current price",
    resultLabel: "Implied yearly FCFF growth",
    fields: [
      { key: "baseFcff", label: "Latest FCFF (₹ Cr)", kind: "crore", positive: true },
      { key: "wacc", label: "WACC (%)", kind: "percent", defaultValue: "12" },
      TERMINAL_GROWTH,
      { key: "forecastYears", label: "Forecast years", kind: "years", defaultValue: "10" },
      NET_DEBT,
      SHARES,
    ],
    discount: { rateKey: "wacc", growthKey: "terminalGrowth" },
  },
];

export const DEFAULT_METHOD: MethodId = "dcf-fcff";

export function findMethod(id: string | undefined): MethodSpec {
  return METHODS.find((method) => method.id === id) ?? METHODS[0];
}

// Stored inputs for one method: field key -> number (integer paise for money fields).
export type MethodValues = Record<string, number>;
export type MethodDraft = Record<string, string>;

export function methodFieldSchemas(spec: MethodSpec): Record<string, z.ZodType<number, string>> {
  return Object.fromEntries(spec.fields.map((field) => [field.key, fieldSchema(field.kind, { positive: field.positive })]));
}

export function methodFormSchema(spec: MethodSpec) {
  return z.object(methodFieldSchemas(spec));
}

export function methodStoredSchema(spec: MethodSpec) {
  return z.object(Object.fromEntries(spec.fields.map((field) => [field.key, z.number()])));
}

export function methodDefaults(spec: MethodSpec): MethodDraft {
  return Object.fromEntries(spec.fields.map((field) => [field.key, field.defaultValue ?? ""]));
}

export function methodToDraft(spec: MethodSpec, stored: MethodValues | null): MethodDraft {
  if (!stored) return methodDefaults(spec);
  return Object.fromEntries(spec.fields.map((field) => [field.key, storedToDraft(field.kind, stored[field.key])]));
}

// Every field valid -> the values to save or evaluate; otherwise null.
export function parseMethodDraft(spec: MethodSpec, draft: MethodDraft): MethodValues | null {
  const parsed = methodFormSchema(spec).safeParse(draft);
  return parsed.success ? (parsed.data as MethodValues) : null;
}

// Cross-field rule for the form: the discount rate must stay above terminal growth.
export function crossFieldErrors(spec: MethodSpec, draft: MethodDraft): Record<string, string> | undefined {
  if (!spec.discount) return undefined;
  const rate = draftToLoose("percent", draft[spec.discount.rateKey] ?? "");
  const growth = draftToLoose("percent", draft[spec.discount.growthKey] ?? "");
  if (rate === null || growth === null || rate > growth) return undefined;
  return { [spec.discount.rateKey]: "Must be above terminal growth" };
}

// A stored value as shown in the read-only (mobile) view.
export function formatFieldValue(kind: FieldKind, stored: number): string {
  switch (kind) {
    case "percent":
      return formatPercent(stored);
    case "multiple":
      return formatMultiple(stored);
    case "crore":
      return formatCrore(paiseToCrore(stored), 1);
    case "rupees":
      return formatRupees(paiseToRupees(stored));
    case "shares":
      return formatNumber(stored, 2);
    case "years":
      return String(stored);
  }
}

export interface EvaluationContext {
  pricePaise: number | null;
  cashFlows: StoredCashFlows | null;
}

export interface MethodResult {
  label: string;
  value: string;
  note: string;
}

type Outcome = Omit<MethodResult, "label">;

const NEEDS_INPUTS = "Fill in every input to see a value.";
const NEEDS_PRICE = "Enter the current price above to see a value.";

function pending(note: string): Outcome {
  return { value: PLACEHOLDER, note };
}

function evaluateDcf(spec: MethodSpec, values: MethodValues, context: EvaluationContext): Outcome {
  if (!context.cashFlows) return pending("Enter the Base-case cash flows in Table 2 first.");

  const isFcff = spec.id === "dcf-fcff";
  const series = cashFlowSeries(storedCashFlowYears(context.cashFlows), context.cashFlows.taxRate);
  const flows = (isFcff ? series.fcff : series.fcfe).filter((flow): flow is number => flow !== null);
  const rate = isFcff ? values.wacc : values.costOfEquity;
  const result = dcf(flows, rate, values.terminalGrowth);
  if (!result) return pending("The discount rate must be above terminal growth.");

  // FCFE is already after debt, so only FCFF subtracts net debt to reach equity.
  const equityCr = isFcff ? result.total - paiseToCrore(values.netDebt) : result.total;
  const price = perShare(equityCr, values.shares);
  const buyBelow = belowMarginOfSafety(price, values.marginOfSafety);
  return {
    value: formatRupees(price),
    note: `${isFcff ? "Equity" : "Equity, discounted at cost of equity,"} ${formatCrore(equityCr)} · buy below ${formatRupees(buyBelow)} with a ${formatPercent(values.marginOfSafety)} margin of safety`,
  };
}

function evaluatePe(values: MethodValues): Outcome {
  const target = targetPriceFromPe(paiseToRupees(values.exitEps), values.targetPe);
  const today = presentValue(target, values.discountRate, values.yearsToExit);
  return {
    value: formatRupees(target),
    note: `At ${formatMultiple(values.targetPe)} exit EPS · worth ${formatRupees(today)} today at ${formatPercent(values.discountRate)} over ${values.yearsToExit} yrs`,
  };
}

function evaluateEvEbitda(values: MethodValues): Outcome {
  const ebitda = paiseToCrore(values.ebitda);
  const equityCr = ebitda * values.targetMultiple - paiseToCrore(values.netDebt);
  const price = targetPriceFromEvEbitda(ebitda, values.targetMultiple, paiseToCrore(values.netDebt), values.shares);
  return {
    value: formatRupees(price),
    note: `Equity value ${formatCrore(equityCr)} ÷ ${formatNumber(values.shares, 2)} Cr shares`,
  };
}

function evaluatePeg(values: MethodValues, context: EvaluationContext): Outcome {
  if (context.pricePaise === null) return pending(NEEDS_PRICE);
  if (values.epsGrowth <= 0) return pending("PEG needs positive EPS growth.");

  const pe = peRatio(paiseToRupees(context.pricePaise), paiseToRupees(values.eps));
  const peg = pegRatio(pe, values.epsGrowth);
  const verdict = peg <= values.fairPeg ? "at or below" : "above";
  return {
    value: formatNumber(peg, 2),
    note: `PE ${formatMultiple(pe)} · ${verdict} the fair PEG of ${formatNumber(values.fairPeg, 1)}`,
  };
}

function evaluateEarningsYield(values: MethodValues, context: EvaluationContext): Outcome {
  if (context.pricePaise === null) return pending(NEEDS_PRICE);

  const yieldPct = earningsYield(paiseToRupees(values.eps), paiseToRupees(context.pricePaise));
  const hurdle = values.riskFreeRate + values.requiredSpread;
  return {
    value: formatPercent(yieldPct),
    note: `Hurdle ${formatPercent(hurdle)} · ${yieldPct >= hurdle ? "clears" : "falls short of"} it`,
  };
}

function evaluateReverseDcf(values: MethodValues, context: EvaluationContext): Outcome {
  if (context.pricePaise === null) return pending(NEEDS_PRICE);

  const price = paiseToRupees(context.pricePaise);
  const growth = impliedGrowth({
    price,
    baseFcffCr: paiseToCrore(values.baseFcff),
    netDebtCr: paiseToCrore(values.netDebt),
    sharesCr: values.shares,
    waccPct: values.wacc,
    terminalGrowthPct: values.terminalGrowth,
    years: values.forecastYears,
  });
  if (growth === null) return pending("No growth from −50% to 100% a year justifies the current price.");
  return {
    value: formatPercent(growth),
    note: `Over ${values.forecastYears} yrs, needed to justify ${formatRupees(price)}`,
  };
}

function evaluateOutcome(spec: MethodSpec, values: MethodValues, context: EvaluationContext): Outcome {
  switch (spec.id) {
    case "dcf-fcff":
    case "dcf-fcfe":
      return evaluateDcf(spec, values, context);
    case "pe":
      return evaluatePe(values);
    case "ev-ebitda":
      return evaluateEvEbitda(values);
    case "peg":
      return evaluatePeg(values, context);
    case "earnings-yield":
      return evaluateEarningsYield(values, context);
    case "reverse-dcf":
      return evaluateReverseDcf(values, context);
  }
}

// `values` is null until every input is valid.
export function evaluateMethod(spec: MethodSpec, values: MethodValues | null, context: EvaluationContext): MethodResult {
  const outcome = values ? evaluateOutcome(spec, values, context) : pending(NEEDS_INPUTS);
  return { label: spec.resultLabel, ...outcome };
}
