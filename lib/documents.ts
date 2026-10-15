import { z } from "zod";
import { todayIso } from "@/lib/dates";
import { linkSchema } from "@/lib/research";

export const DOCUMENT_TYPES = ["Concall", "Quarterly result", "Investor presentation", "Annual report", "Other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_SUMMARY_LENGTH = 20000;

export interface CompanyDocument {
  id: string;
  title: string;
  type: DocumentType;
  // The quarter or year it covers ("Q1 FY27", "FY26"), free text.
  period: string | null;
  // ISO date of the document itself.
  date: string;
  // Exactly one of the two sources is set: a PDF kept in storage, or a web link.
  file: { path: string; name: string } | null;
  url: string | null;
  summary: string | null;
}

// What the dialog is doing: adding a PDF, adding a link, or editing the details of an existing file document.
export type DocumentMode = "upload" | "link" | "details";

const isPdf = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const pdfFile = z
  .custom<File | null>((value) => value instanceof File, "Choose a PDF file")
  .refine((file) => file !== null && isPdf(file), "Choose a PDF file")
  .refine((file) => file !== null && file.size <= MAX_PDF_BYTES, "That file is over 20 MB");

export function documentFormSchema(mode: DocumentMode) {
  // Typed so both modes give the same schema type, which is what a form field validator is declared against.
  const url: z.ZodType<string, string> = mode === "link" ? linkSchema.shape.url : z.string();
  return z.object({
    title: z.string().trim().min(1, "Enter a title").max(120, "Keep it under 120 characters"),
    type: z.enum(DOCUMENT_TYPES, "Choose a type"),
    period: z.string().trim().max(20, "Keep it under 20 characters"),
    date: z.iso.date("Enter the document date"),
    // Each field is only checked in the mode that shows it.
    url,
    file: mode === "upload" ? pdfFile : z.custom<File | null>(),
  });
}

export type DocumentValues = z.output<ReturnType<typeof documentFormSchema>>;

export interface DocumentDraft {
  title: string;
  type: DocumentType | "";
  period: string;
  date: string;
  url: string;
  file: File | null;
}

export function documentDefaults(): DocumentDraft {
  return { title: "", type: "", period: "", date: todayIso(), url: "", file: null };
}

export function documentToDraft(document: CompanyDocument): DocumentDraft {
  return {
    title: document.title,
    type: document.type,
    period: document.period ?? "",
    date: document.date,
    url: document.url ?? "",
    file: null,
  };
}

// Storage object path: one folder per company, an unguessable name, and never the user's file name.
export function newStoragePath(companyId: string): string {
  return `${companyId}/${crypto.randomUUID()}.pdf`;
}

export const summarySchema = z.object({
  summary: z.string().max(MAX_SUMMARY_LENGTH, `Keep it under ${MAX_SUMMARY_LENGTH.toLocaleString("en-IN")} characters`),
});
