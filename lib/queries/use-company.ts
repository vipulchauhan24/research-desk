import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { COMPANIES_KEY, COMPANY_SELECT, toCompanyListItem, type CompanyListItem } from "./use-companies";

// Nested under COMPANIES_KEY so invalidating the list also refreshes an open company page.
export const companyKey = (id: string) => [...COMPANIES_KEY, id] as const;

// Postgres invalid_text_representation: the URL segment isn't a UUID, so there is no such company.
const INVALID_UUID = "22P02";

async function fetchCompany(id: string): Promise<CompanyListItem | null> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .eq("id", id)
    .order("as_of", { referencedTable: "price_entries", ascending: false })
    .limit(1, { referencedTable: "price_entries" })
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_UUID) return null;
    throw error;
  }
  return data && toCompanyListItem(data);
}

// null data means "no such company"; an error means the lookup itself failed.
export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: companyKey(id ?? ""),
    queryFn: () => fetchCompany(id as string),
    enabled: Boolean(id),
  });
}
