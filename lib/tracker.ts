import { z } from "zod";
import { fiscalQuarterSchema } from "@/lib/fiscal-quarter";
import { formatCrore, formatFiscalQuarter, formatPercent } from "@/lib/format";
import {
  basisPointsToPercent,
  basisPointsToPercentInput,
  croreToPaise,
  paiseToCrore,
  paiseToCroreInput,
  percentToBasisPoints,
} from "@/lib/money";

export const TRACKER_UNITS = ["crore", "percent"] as const;
export const TRACKER_CASES = ["Bear", "Base", "Bull"] as const;
export type TrackerUnit = (typeof TRACKER_UNITS)[number];
export type TrackerCase = (typeof TRACKER_CASES)[number];

export const UNIT_LABEL: Record<TrackerUnit, string> = { crore: "₹ Cr", percent: "%" };

export interface TrackerRow {
  id: string;
  fiscalYear: number;
  quarter: number;
  metric: string;
  unit: TrackerUnit;
  case: TrackerCase;
  // Integer paise for ₹ Cr metrics, basis points for % metrics (see percentToBasisPoints).
  predicted: number;
  // Null until the quarter is reported.
  actual: number | null;
}

// ---- Quarters -------------------------------------------------------------------------------------------------

export interface QuarterKey {
  fiscalYear: number;
  quarter: number;
}

export const quarterId = ({ fiscalYear, quarter }: QuarterKey) => `${fiscalYear}-${quarter}`;
export const quarterLabel = ({ fiscalYear, quarter }: QuarterKey) => formatFiscalQuarter(fiscalYear, quarter);

// The quarters that have rows, newest first.
export function trackedQuarters(rows: TrackerRow[]): QuarterKey[] {
  const seen = new Map<string, QuarterKey>();
  for (const { fiscalYear, quarter } of rows) seen.set(quarterId({ fiscalYear, quarter }), { fiscalYear, quarter });
  return [...seen.values()].sort((a, b) => b.fiscalYear - a.fiscalYear || b.quarter - a.quarter);
}

// ---- Display --------------------------------------------------------------------------------------------------

export function formatTrackerValue(unit: TrackerUnit, stored: number): string {
  return unit === "crore" ? formatCrore(paiseToCrore(stored), 1) : formatPercent(basisPointsToPercent(stored));
}

const valueToInput = (unit: TrackerUnit, stored: number) =>
  unit === "crore" ? paiseToCroreInput(stored) : basisPointsToPercentInput(stored);

const valueToStored = (unit: TrackerUnit, text: string) =>
  unit === "crore" ? croreToPaise(text) : percentToBasisPoints(text);

// ---- Form -----------------------------------------------------------------------------------------------------

const decimal = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => value.replaceAll(",", ""))
    .pipe(z.string().regex(/^-?\d{1,8}(\.\d{1,2})?$/, message));

// The per-field schemas, kept apart from the converting schema below so a form field can validate against one.
export const trackerFieldsSchema = z.object({
  metric: z.string().trim().min(1, "Enter the metric").max(60, "Keep it under 60 characters"),
  unit: z.enum(TRACKER_UNITS, "Choose a unit"),
  case: z.enum(TRACKER_CASES, "Choose a case"),
  quarter: fiscalQuarterSchema,
  predicted: decimal("Enter a number, up to 2 decimals"),
  // Empty until the result is out.
  actual: z.union([z.literal(""), decimal("Enter a number, up to 2 decimals")]),
});

// The numbers become stored integers using the chosen unit, so this runs on submit, not per field.
export const trackerFormSchema = trackerFieldsSchema.transform((value) => ({
  ...value,
  predicted: valueToStored(value.unit, value.predicted),
  actual: value.actual === "" ? null : valueToStored(value.unit, value.actual),
}));

export type TrackerValues = z.output<typeof trackerFormSchema>;

export interface TrackerDraft {
  metric: string;
  unit: TrackerUnit;
  case: TrackerCase;
  quarter: string;
  predicted: string;
  actual: string;
}

export function trackerDefaults(quarter: QuarterKey | null): TrackerDraft {
  return {
    metric: "",
    unit: "crore",
    case: "Base",
    quarter: quarter ? quarterLabel(quarter) : "",
    predicted: "",
    actual: "",
  };
}

export function trackerToDraft(row: TrackerRow): TrackerDraft {
  return {
    metric: row.metric,
    unit: row.unit,
    case: row.case,
    quarter: quarterLabel(row),
    predicted: valueToInput(row.unit, row.predicted),
    actual: row.actual === null ? "" : valueToInput(row.unit, row.actual),
  };
}
