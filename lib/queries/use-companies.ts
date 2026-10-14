import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { COMPANY_STATUSES, IDEA_SOURCES } from "@/lib/company";
import type { CompanyStatus, IdeaSource } from "@/lib/company";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export const COMPANIES_KEY = ["companies"] as const;

export interface CompanyListItem {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  businessType: string;
  ideaSource: IdeaSource;
  status: CompanyStatus;
  pricePaise: number | null;
  priceAsOf: string | null;
}

// The DB check constraints guarantee these values; parsing narrows the column types and fails loudly if they ever drift.
const statusSchema = z.enum(COMPANY_STATUSES);
const ideaSourceSchema = z.enum(IDEA_SOURCES);

type PriceRow = Pick<Database["public"]["Tables"]["price_entries"]["Row"], "price_paise" | "as_of">;
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"] & { price_entries: PriceRow[] };

// Shared with the single-company query so the list and the company page can't disagree on shape.
export const COMPANY_SELECT =
  "id, name, symbol, exchange, business_type, idea_source, status, created_at, price_entries(price_paise, as_of)";

export function toCompanyListItem(row: CompanyRow): CompanyListItem {
  // The query asks for only the newest price, so the first (and only) entry is the current one.
  const latest = row.price_entries[0];
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    exchange: row.exchange,
    businessType: row.business_type,
    ideaSource: ideaSourceSchema.parse(row.idea_source),
    status: statusSchema.parse(row.status),
    pricePaise: latest?.price_paise ?? null,
    priceAsOf: latest?.as_of ?? null,
  };
}

async function fetchCompanies(): Promise<CompanyListItem[]> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .order("name")
    // Only the most recent price per company is the "current" one.
    .order("as_of", { referencedTable: "price_entries", ascending: false })
    .limit(1, { referencedTable: "price_entries" });

  if (error) throw error;
  return data.map(toCompanyListItem);
}

export function useCompanies() {
  return useQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanies });
}
