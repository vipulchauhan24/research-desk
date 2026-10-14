import { z } from "zod";

export const EXCHANGES = ["NSE", "BSE"] as const;
export const COMPANY_STATUSES = ["Watch", "Buy", "Hold", "Sell"] as const;
export const IDEA_SOURCES = ["Big order", "PEAD", "Analyst", "Other"] as const;
// The categories used in the design prototype. The DB column is free text, so this list can grow without a migration.
export const BUSINESS_TYPES = ["Stalwart", "Fast grower", "Slow grower", "Cyclical"] as const;

export type Exchange = (typeof EXCHANGES)[number];
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
export type IdeaSource = (typeof IDEA_SOURCES)[number];

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the company name"),
  exchange: z.enum(EXCHANGES, "Choose an exchange"),
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9&-]{1,20}$/, "Use letters, digits, & or - (up to 20 characters)"),
  businessType: z.string().min(1, "Choose a business type"),
  ideaSource: z.enum(IDEA_SOURCES, "Choose an idea source"),
  status: z.enum(COMPANY_STATUSES, "Choose a status"),
});

export type CompanyFormInput = z.infer<typeof companyFormSchema>;

// What the form holds before it is valid: selects start empty, which the schema rejects with a message.
export interface CompanyFormDraft {
  name: string;
  exchange: Exchange;
  symbol: string;
  businessType: string;
  ideaSource: IdeaSource | "";
  status: CompanyStatus;
}

export const COMPANY_FORM_DEFAULTS: CompanyFormDraft = {
  name: "",
  exchange: "NSE",
  symbol: "",
  businessType: "",
  ideaSource: "",
  status: "Watch",
};

// Accepts what people type ("1,284.5"), then checks the plain number: up to 2 decimals, above zero.
export const priceFormSchema = z.object({
  price: z
    .string()
    .trim()
    .transform((value) => value.replaceAll(",", ""))
    .pipe(
      z
        .string()
        .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a price like 1284.50")
        .refine((value) => Number(value) > 0, "Enter a price above zero"),
    ),
});

export interface PriceFormDraft {
  price: string;
}

export interface CompanyFilters {
  query: string;
  status: "All" | CompanyStatus;
  ideaSource: "All" | IdeaSource;
}

interface Filterable {
  name: string;
  symbol: string;
  status: string;
  ideaSource: string;
}

export function filterCompanies<T extends Filterable>(companies: T[], filters: CompanyFilters): T[] {
  const query = filters.query.trim().toLowerCase();
  return companies.filter(
    (company) =>
      (!query || company.name.toLowerCase().includes(query) || company.symbol.toLowerCase().includes(query)) &&
      (filters.status === "All" || company.status === filters.status) &&
      (filters.ideaSource === "All" || company.ideaSource === filters.ideaSource),
  );
}
