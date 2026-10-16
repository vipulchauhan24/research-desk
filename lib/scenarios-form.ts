import { z } from "zod";
import { currentFiscalYear } from "@/lib/dates";
import { formatFiscalYear } from "@/lib/format";
import { paiseToCrore, paiseToRupees } from "@/lib/money";
import {
  CASE_KEYS,
  CASE_LABEL,
  GRID_MODES,
  MAX_PERIODS,
  MODE_LABEL,
  PERIOD_FIELDS,
  SCENARIO_METHODS,
  computeCase,
  effectiveInputs,
  expectedReturnPct,
  periodAt,
  periodLabel,
  probabilityTotal,
  weightedTarget,
  yearsToFiscalYearEnd,
  type CaseKey,
  type GridMode,
  type PeriodField,
  type PeriodInputs,
  type PeriodRef,
  type Probabilities,
} from "@/lib/scenarios";
import { fieldSchema, storedToDraft, type FieldKind } from "@/lib/valuation-fields";

// How each period field is typed and stored. Money is integer paise; the rest are plain numbers.
const FIELD_KIND: Record<PeriodField, { kind: FieldKind; positive?: boolean }> = {
  sales: { kind: "crore", positive: true },
  growth: { kind: "percent" },
  opm: { kind: "percent" },
  otherIncome: { kind: "crore" },
  interest: { kind: "crore" },
  depreciation: { kind: "crore" },
  taxRate: { kind: "percent" },
  pat: { kind: "crore" },
  patGrowth: { kind: "percent" },
  shares: { kind: "shares" },
  netDebt: { kind: "crore" },
  pe: { kind: "multiple" },
  evMultiple: { kind: "multiple" },
};

export const PERIOD_FIELD_LABEL: Record<PeriodField, string> = {
  sales: "Sales",
  growth: "Sales growth %",
  opm: "OPM %",
  otherIncome: "Other income",
  interest: "Interest",
  depreciation: "Depreciation",
  taxRate: "Tax %",
  pat: "Net profit",
  patGrowth: "PAT growth %",
  shares: "Shares (Cr)",
  netDebt: "Net debt",
  pe: "PE (x)",
  evMultiple: "EV/EBITDA (x)",
};

// A scenario is filled in over time, so an empty cell is allowed and stored as null.
function optionalFieldSchema(field: PeriodField): z.ZodType<number | null, string> {
  const { kind, positive } = FIELD_KIND[field];
  const value =
    field === "taxRate"
      ? fieldSchema("percent").pipe(z.number().min(0, "Use 0 to 100").max(100, "Use 0 to 100"))
      : fieldSchema(kind, { positive });
  // Not a union of "empty" and "valid": a union reports a vague "Invalid input" instead of what is wrong.
  return z
    .string()
    .trim()
    .transform((text, context) => {
      if (text === "") return null;
      const parsed = value.safeParse(text);
      if (parsed.success) return parsed.data;
      context.addIssue({ code: "custom", message: parsed.error.issues[0].message });
      return z.NEVER;
    });
}

export const periodFieldSchemas = Object.fromEntries(
  PERIOD_FIELDS.map((field) => [field, optionalFieldSchema(field)]),
) as Record<PeriodField, z.ZodType<number | null, string>>;

// ---- Drafts: what the form holds (text) ------------------------------------------------------------------------

export type PeriodDraft = { id: string } & Record<PeriodField, string>;

export type GridDraft = {
  // The fiscal year (named for the year it ends in) and quarter of the first column.
  startYear: string;
  startQuarter: string;
  // How many leading periods are reported results; the rest are estimates.
  actualCount: string;
  cases: Record<CaseKey, PeriodDraft[]>;
}

export type ScenarioDraft = {
  method: (typeof SCENARIO_METHODS)[number];
  probabilities: Record<CaseKey, string>;
  // Fiscal year of the yearly estimate the targets are read from.
  targetYear: string;
  yearly: GridDraft;
  quarterly: GridDraft;
}

const periodDraftSchema = z.object({
  id: z.string(),
  ...Object.fromEntries(PERIOD_FIELDS.map((field) => [field, z.string()])),
}) as unknown as z.ZodType<PeriodDraft>;

const gridDraftSchema = z.object({
  startYear: z.string(),
  startQuarter: z.string(),
  actualCount: z.string(),
  cases: z.object({
    bear: z.array(periodDraftSchema),
    base: z.array(periodDraftSchema),
    bull: z.array(periodDraftSchema),
  }),
});

// Reads a draft back from the database. Drafts hold raw typed text, so half-typed numbers survive a reload.
export const scenarioDraftSchema = z.object({
  method: z.enum(SCENARIO_METHODS),
  probabilities: z.object({ bear: z.string(), base: z.string(), bull: z.string() }),
  targetYear: z.string(),
  yearly: gridDraftSchema,
  quarterly: gridDraftSchema,
});

const DEFAULT_TAX_RATE = "25";

export function emptyPeriod(): PeriodDraft {
  const blank = Object.fromEntries(PERIOD_FIELDS.map((field) => [field, ""])) as Record<PeriodField, string>;
  return { id: crypto.randomUUID(), ...blank, taxRate: DEFAULT_TAX_RATE };
}

// A new estimate starts from the one before it, so only what changes needs typing. Reported-only figures start empty.
function periodAfter(previous: PeriodDraft): PeriodDraft {
  return { ...previous, id: crypto.randomUUID(), sales: "", pat: "" };
}

function addQuarters(fiscalYear: number, quarter: number, delta: number) {
  const total = fiscalYear * 4 + (quarter - 1) + delta;
  return { fiscalYear: Math.floor(total / 4), quarter: (total % 4) + 1 };
}

function emptyGrid(startYear: number, startQuarter: number, actualCount: number, length: number): GridDraft {
  const periods = () => Array.from({ length }, emptyPeriod);
  return {
    startYear: String(startYear),
    startQuarter: String(startQuarter),
    actualCount: String(actualCount),
    cases: { bear: periods(), base: periods(), bull: periods() },
  };
}

// Calendar month to fiscal quarter: April–June is Q1.
function currentFiscalQuarter(now: Date): number {
  return Math.floor(((now.getMonth() + 9) % 12) / 3) + 1;
}

export function defaultScenarioDraft(now = new Date()): ScenarioDraft {
  const fiscalYear = currentFiscalYear(now);
  // Two reported years and three estimates; for quarters, the last three reported and three ahead.
  const quarterStart = addQuarters(fiscalYear, currentFiscalQuarter(now), -4);
  return {
    method: "margin-profit-growth",
    probabilities: { bear: "25", base: "50", bull: "25" },
    targetYear: String(fiscalYear + 1),
    yearly: emptyGrid(fiscalYear - 2, 1, 2, 5),
    quarterly: emptyGrid(quarterStart.fiscalYear, quarterStart.quarter, 3, 6),
  };
}

export function addPeriod(grid: GridDraft): GridDraft {
  if (grid.cases.base.length >= MAX_PERIODS) return grid;
  const next = (periods: PeriodDraft[]) => [...periods, periodAfter(periods[periods.length - 1] ?? emptyPeriod())];
  return { ...grid, cases: { bear: next(grid.cases.bear), base: next(grid.cases.base), bull: next(grid.cases.bull) } };
}

export function canRemovePeriod(grid: GridDraft): boolean {
  // At least one estimate must remain after the reported periods.
  return grid.cases.base.length > (Number.parseInt(grid.actualCount, 10) || 0) + 1;
}

export function removePeriod(grid: GridDraft): GridDraft {
  if (!canRemovePeriod(grid)) return grid;
  const trim = (periods: PeriodDraft[]) => periods.slice(0, -1);
  return { ...grid, cases: { bear: trim(grid.cases.bear), base: trim(grid.cases.base), bull: trim(grid.cases.bull) } };
}

// ---- The saved version (validated numbers) ----------------------------------------------------------------------

const periodStoredSchema = z.object(
  Object.fromEntries(PERIOD_FIELDS.map((field) => [field, z.number().nullable()])),
) as unknown as z.ZodType<Record<PeriodField, number | null>>;

const gridStoredSchema = z.object({
  startYear: z.number().int(),
  startQuarter: z.number().int().min(1).max(4),
  actualCount: z.number().int().min(0),
  cases: z.object({
    bear: z.array(periodStoredSchema).min(1).max(MAX_PERIODS),
    base: z.array(periodStoredSchema).min(1).max(MAX_PERIODS),
    bull: z.array(periodStoredSchema).min(1).max(MAX_PERIODS),
  }),
});

// Amounts inside are integer paise (see valuation_inputs).
export const scenarioStoredSchema = z.object({
  method: z.enum(SCENARIO_METHODS),
  probabilities: z.object({ bear: z.number().int(), base: z.number().int(), bull: z.number().int() }),
  targetYear: z.number().int(),
  yearly: gridStoredSchema,
  quarterly: gridStoredSchema,
});

export type ScenarioStored = z.infer<typeof scenarioStoredSchema>;
type GridStored = z.infer<typeof gridStoredSchema>;

function gridToDraft(grid: GridStored): GridDraft {
  const periods = (stored: GridStored["cases"][CaseKey]) =>
    stored.map((period) => {
      const entries = PERIOD_FIELDS.map((field) => {
        const value = period[field];
        return [field, value === null ? "" : storedToDraft(FIELD_KIND[field].kind, value)] as const;
      });
      return { id: crypto.randomUUID(), ...(Object.fromEntries(entries) as Record<PeriodField, string>) };
    });
  return {
    startYear: String(grid.startYear),
    startQuarter: String(grid.startQuarter),
    actualCount: String(grid.actualCount),
    cases: { bear: periods(grid.cases.bear), base: periods(grid.cases.base), bull: periods(grid.cases.bull) },
  };
}

export function scenarioToDraft(stored: ScenarioStored): ScenarioDraft {
  return {
    method: stored.method,
    probabilities: {
      bear: String(stored.probabilities.bear),
      base: String(stored.probabilities.base),
      bull: String(stored.probabilities.bull),
    },
    targetYear: String(stored.targetYear),
    yearly: gridToDraft(stored.yearly),
    quarterly: gridToDraft(stored.quarterly),
  };
}

// ---- Saving: draft text -> stored numbers -----------------------------------------------------------------------

const whole = (message: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, message)
    .transform(Number)
    .pipe(z.number().int().min(min, message).max(max, message));

const periodFormSchema = z.object(
  Object.fromEntries(PERIOD_FIELDS.map((field) => [field, periodFieldSchemas[field]])),
) as unknown as z.ZodType<Record<PeriodField, number | null>, Record<PeriodField, string>>;

const gridFormSchema = z.object({
  startYear: whole("Enter a fiscal year like 2027", 2000, 2100),
  startQuarter: whole("Use a quarter from 1 to 4", 1, 4),
  actualCount: whole("Enter a whole number of reported periods", 0, MAX_PERIODS),
  cases: z.object({
    bear: z.array(periodFormSchema).min(1).max(MAX_PERIODS),
    base: z.array(periodFormSchema).min(1).max(MAX_PERIODS),
    bull: z.array(periodFormSchema).min(1).max(MAX_PERIODS),
  }),
});

export const probabilityFieldSchema = whole("Use a whole number from 0 to 100", 0, 100);

export const scenarioFormSchema = z
  .object({
    method: z.enum(SCENARIO_METHODS),
    probabilities: z.object({ bear: probabilityFieldSchema, base: probabilityFieldSchema, bull: probabilityFieldSchema }),
    targetYear: whole("Choose the target year", 2000, 2100),
    yearly: gridFormSchema,
    quarterly: gridFormSchema,
  })
  .superRefine((value, context) => {
    if (probabilityTotal(value.probabilities) !== 100) {
      context.addIssue({ code: "custom", path: ["probabilities"], message: "Probabilities must total 100%" });
    }
    for (const mode of GRID_MODES) {
      const grid = value[mode];
      const lengths = CASE_KEYS.map((key) => grid.cases[key].length);
      if (new Set(lengths).size !== 1) {
        context.addIssue({ code: "custom", path: [mode], message: "Bear, Base and Bull need the same number of periods" });
      } else if (grid.actualCount >= lengths[0]) {
        context.addIssue({ code: "custom", path: [mode, "actualCount"], message: "Leave at least one estimate period" });
      }
    }
    const yearly = value.yearly;
    const first = yearly.startYear + yearly.actualCount;
    const last = yearly.startYear + yearly.cases.base.length - 1;
    if (value.targetYear < first || value.targetYear > last) {
      context.addIssue({ code: "custom", path: ["targetYear"], message: "Choose a yearly estimate as the target year" });
    }
  });

const SECTION_LABEL: Record<string, string> = {
  startYear: "First period",
  startQuarter: "First quarter",
  actualCount: "Reported periods",
};

// "Yearly, Bear case, period 3, OPM %: Enter a number": where a problem is, in words a person can find.
function describeIssue(path: PropertyKey[], message: string): string {
  const where: string[] = [];
  const [first, second, third, index, field] = path;
  if (typeof first === "string" && GRID_MODES.includes(first as GridMode)) where.push(MODE_LABEL[first as GridMode]);
  if (second === "cases" && typeof third === "string") where.push(`${CASE_LABEL[third as CaseKey] ?? third} case`);
  if (typeof index === "number") where.push(`period ${index + 1}`);
  const last = path[path.length - 1];
  if (typeof field === "string") where.push(PERIOD_FIELD_LABEL[field as PeriodField] ?? field);
  else if (typeof last === "string" && SECTION_LABEL[last]) where.push(SECTION_LABEL[last]);
  return where.length > 0 ? `${where.join(", ")}: ${message}` : message;
}

export type ParsedScenario = { ok: true; data: ScenarioStored } | { ok: false; message: string };

export function parseScenarioDraft(draft: ScenarioDraft): ParsedScenario {
  const result = scenarioFormSchema.safeParse(draft);
  if (result.success) return { ok: true, data: result.data as ScenarioStored };
  const [issue] = result.error.issues;
  return { ok: false, message: describeIssue(issue.path, issue.message) };
}

// ---- Live numbers from the text typed so far ---------------------------------------------------------------------

export interface LooseGrid {
  // Null when the first period isn't a valid year yet; labels fall back to "Period n".
  refs: (PeriodRef | null)[];
  actualCount: number;
  cases: Record<CaseKey, PeriodInputs[]>;
}

function toNatural(field: PeriodField, stored: number | null): number | null {
  if (stored === null) return null;
  return FIELD_KIND[field].kind === "crore" ? paiseToCrore(stored) : stored;
}

function looseInputs(period: PeriodDraft): PeriodInputs {
  return Object.fromEntries(
    PERIOD_FIELDS.map((field) => {
      const parsed = periodFieldSchemas[field].safeParse(period[field]);
      return [field, parsed.success ? toNatural(field, parsed.data) : null];
    }),
  ) as PeriodInputs;
}

export function looseGrid(grid: GridDraft, mode: GridMode): LooseGrid {
  const length = grid.cases.base.length;
  const startYear = whole("", 2000, 2100).safeParse(grid.startYear);
  const startQuarter = whole("", 1, 4).safeParse(grid.startQuarter);
  const refs = Array.from({ length }, (_, index) =>
    startYear.success ? periodAt(mode, startYear.data, startQuarter.success ? startQuarter.data : 1, index) : null,
  );
  const reported = whole("", 0, MAX_PERIODS).safeParse(grid.actualCount);
  return {
    refs,
    // Always at least one estimate, whatever is typed.
    actualCount: reported.success ? Math.min(reported.data, length - 1) : 0,
    cases: {
      bear: grid.cases.bear.map(looseInputs),
      base: grid.cases.base.map(looseInputs),
      bull: grid.cases.bull.map(looseInputs),
    },
  };
}

export function gridLabels(loose: LooseGrid): string[] {
  return loose.refs.map((ref, index) => (ref ? periodLabel(ref, index < loose.actualCount) : `Period ${index + 1}`));
}

export function parseProbabilities(draft: ScenarioDraft): Probabilities | null {
  const parsed = z.object({ bear: probabilityFieldSchema, base: probabilityFieldSchema, bull: probabilityFieldSchema }).safeParse(draft.probabilities);
  return parsed.success ? parsed.data : null;
}

// The split as typed so far, with anything not yet a valid number counted as 0 (used to re-balance the others).
export function lenientProbabilities(draft: ScenarioDraft): Probabilities {
  const read = (key: CaseKey) => {
    const parsed = probabilityFieldSchema.safeParse(draft.probabilities[key]);
    return parsed.success ? parsed.data : 0;
  };
  return { bear: read("bear"), base: read("base"), bull: read("bull") };
}

export interface ScenarioSummary {
  targets: Record<CaseKey, number | null>;
  // The year the targets are read from, e.g. "FY28E"; null if the target year isn't one of the yearly estimates.
  targetLabel: string | null;
  // Null until all three targets and a valid 100% split exist.
  weighted: number | null;
  expectedReturn: number | null;
  yearsToTarget: number | null;
  probabilitiesOk: boolean;
}

// The five summary cards. Targets come from the yearly grid at the chosen year, whichever grid is on screen.
export function summarise(draft: ScenarioDraft, pricePaise: number | null, now = new Date()): ScenarioSummary {
  const yearly = looseGrid(draft.yearly, "yearly");
  const targetYear = whole("", 2000, 2100).safeParse(draft.targetYear);
  const index = targetYear.success
    ? yearly.refs.findIndex((ref, position) => ref?.fiscalYear === targetYear.data && position >= yearly.actualCount)
    : -1;

  const targets = Object.fromEntries(
    CASE_KEYS.map((key) => {
      const computed = computeCase(draft.method, "yearly", effectiveInputs(key, yearly.cases, yearly.actualCount), yearly.actualCount);
      return [key, index >= 0 ? computed[index].price : null];
    }),
  ) as Record<CaseKey, number | null>;

  const probabilities = parseProbabilities(draft);
  const probabilitiesOk = probabilities !== null && probabilityTotal(probabilities) === 100;
  const weighted = probabilities && probabilitiesOk ? weightedTarget(targets, probabilities) : null;
  const price = pricePaise === null ? null : paiseToRupees(pricePaise);

  return {
    targets,
    targetLabel: index >= 0 && targetYear.success ? formatFiscalYear(targetYear.data, true) : null,
    weighted,
    expectedReturn: expectedReturnPct(weighted, price),
    yearsToTarget: targetYear.success && index >= 0 ? yearsToFiscalYearEnd(targetYear.data, now) : null,
    probabilitiesOk,
  };
}

// The yearly estimates, for the target-year select.
export function targetYearOptions(draft: GridDraft): { value: string; label: string }[] {
  const yearly = looseGrid(draft, "yearly");
  return yearly.refs.flatMap((ref, index) =>
    ref && index >= yearly.actualCount ? [{ value: String(ref.fiscalYear), label: formatFiscalYear(ref.fiscalYear, true) }] : [],
  );
}
