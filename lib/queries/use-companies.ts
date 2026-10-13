import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { COMPANY_STATUSES, IDEA_SOURCES } from "@/lib/company";
import type { CompanyStatus, IdeaSource } from "@/lib/company";
import { supabase } from "@/lib/supabase/client";

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

async function fetchCompanies(): Promise<CompanyListItem[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, symbol, exchange, business_type, idea_source, status, price_entries(price_paise, as_of)")
    .order("name")
    // Only the most recent price per company is the "current" one.
    .order("as_of", { referencedTable: "price_entries", ascending: false })
    .limit(1, { referencedTable: "price_entries" });

  if (error) throw error;

  return data.map((row) => {
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
  });
}

export function useCompanies() {
  return useQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanies });
}
