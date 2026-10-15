import { z } from "zod";
import { fiscalQuarterSchema } from "@/lib/fiscal-quarter";
import { formatFiscalQuarter } from "@/lib/format";
import { linkSchema } from "@/lib/research";
import { fieldSchema, storedToDraft } from "@/lib/valuation-fields";

export const ORDER_STATUSES = ["Open", "In execution", "Completed"] as const;
export const CAPEX_STATUSES = ["Planned", "In progress", "Commissioned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type CapexStatus = (typeof CAPEX_STATUSES)[number];

export interface OrderBookRow {
  id: string;
  customer: string;
  // First day of the month, "2026-06-01".
  orderedOn: string;
  valuePaise: number;
  executionBy: string;
  status: OrderStatus;
  sourceNote: string | null;
  sourceUrl: string | null;
}

export interface CapexRow {
  id: string;
  project: string;
  capacityAdded: string | null;
  outlayPaise: number;
  funding: string | null;
  status: CapexStatus;
  commissioningFy: number;
  commissioningQuarter: number;
  sourceNote: string | null;
  sourceUrl: string | null;
}

// ---- Headline figures -----------------------------------------------------------------------------------------

// A completed order has been executed, so it is no longer backlog.
export function inOrderBook(row: OrderBookRow): boolean {
  return row.status !== "Completed";
}

export function orderBookTotalPaise(rows: OrderBookRow[]): number {
  return rows.filter(inOrderBook).reduce((sum, row) => sum + row.valuePaise, 0);
}

// Share of the open order book in percent; null for a completed order, which is outside the total.
export function orderShare(row: OrderBookRow, totalPaise: number): number | null {
  return inOrderBook(row) && totalPaise > 0 ? (row.valuePaise / totalPaise) * 100 : null;
}

// The month of the latest order still in the book: how fresh the headline figure is.
export function orderBookAsOf(rows: OrderBookRow[]): string | null {
  // ISO dates sort as text.
  return rows.filter(inOrderBook).reduce<string | null>((latest, row) => (latest && latest > row.orderedOn ? latest : row.orderedOn), null);
}

export function capexTotalPaise(rows: CapexRow[]): number {
  return rows.reduce((sum, row) => sum + row.outlayPaise, 0);
}

// ---- Form schemas ---------------------------------------------------------------------------------------------

const MAX_SOURCE_NOTE_LENGTH = 200;

// Typed as 2026-06 and stored as the first of that month.
const month = z
  .string()
  .trim()
  .regex(/^20\d{2}-(0[1-9]|1[0-2])$/, "Use year and month, like 2026-06")
  .transform((value) => `${value}-01`);

const sourceNote = z.string().trim().max(MAX_SOURCE_NOTE_LENGTH, `Keep it under ${MAX_SOURCE_NOTE_LENGTH} characters`);
// Empty is allowed; anything typed must be a web address (https:// is added to a bare one).
const sourceUrl = z.string().trim().pipe(z.union([z.literal(""), linkSchema.shape.url]));

export const orderBookFormSchema = z.object({
  customer: z.string().trim().min(1, "Enter the customer or segment").max(120, "Keep it under 120 characters"),
  orderedOn: month,
  value: fieldSchema("crore", { positive: true }),
  executionBy: month,
  status: z.enum(ORDER_STATUSES, "Choose a status"),
  sourceNote,
  sourceUrl,
});

export const capexFormSchema = z.object({
  project: z.string().trim().min(1, "Enter the project").max(120, "Keep it under 120 characters"),
  capacityAdded: z.string().trim().max(120, "Keep it under 120 characters"),
  outlay: fieldSchema("crore", { positive: true }),
  funding: z.string().trim().max(80, "Keep it under 80 characters"),
  status: z.enum(CAPEX_STATUSES, "Choose a status"),
  commissioning: fiscalQuarterSchema,
  sourceNote,
  sourceUrl,
});

export type OrderBookValues = z.output<typeof orderBookFormSchema>;
export type CapexValues = z.output<typeof capexFormSchema>;

export interface OrderBookDraft {
  customer: string;
  orderedOn: string;
  value: string;
  executionBy: string;
  status: OrderStatus;
  sourceNote: string;
  sourceUrl: string;
}

export interface CapexDraft {
  project: string;
  capacityAdded: string;
  outlay: string;
  funding: string;
  status: CapexStatus;
  commissioning: string;
  sourceNote: string;
  sourceUrl: string;
}

export const ORDER_BOOK_DEFAULTS: OrderBookDraft = {
  customer: "",
  orderedOn: "",
  value: "",
  executionBy: "",
  status: "Open",
  sourceNote: "",
  sourceUrl: "",
};

export const CAPEX_DEFAULTS: CapexDraft = {
  project: "",
  capacityAdded: "",
  outlay: "",
  funding: "",
  status: "Planned",
  commissioning: "",
  sourceNote: "",
  sourceUrl: "",
};

// "2026-06-01" -> "2026-06", the text the form shows.
const monthDraft = (iso: string) => iso.slice(0, 7);

export function orderBookToDraft(row: OrderBookRow): OrderBookDraft {
  return {
    customer: row.customer,
    orderedOn: monthDraft(row.orderedOn),
    value: storedToDraft("crore", row.valuePaise),
    executionBy: monthDraft(row.executionBy),
    status: row.status,
    sourceNote: row.sourceNote ?? "",
    sourceUrl: row.sourceUrl ?? "",
  };
}

export function capexToDraft(row: CapexRow): CapexDraft {
  return {
    project: row.project,
    capacityAdded: row.capacityAdded ?? "",
    outlay: storedToDraft("crore", row.outlayPaise),
    funding: row.funding ?? "",
    status: row.status,
    commissioning: formatFiscalQuarter(row.commissioningFy, row.commissioningQuarter),
    sourceNote: row.sourceNote ?? "",
    sourceUrl: row.sourceUrl ?? "",
  };
}
