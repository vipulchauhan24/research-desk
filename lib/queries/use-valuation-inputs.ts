import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

// Saved inputs by key: a method id, or a shared Base-case table ('cash-flows', 'exit-prices').
export type ValuationInputs = Record<string, Json>;

export const valuationKey = (companyId: string) => ["valuation", companyId] as const;

async function fetchInputs(companyId: string): Promise<ValuationInputs> {
  const { data, error } = await supabase.from("valuation_inputs").select("method, inputs").eq("company_id", companyId);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.method, row.inputs]));
}

export function useValuationInputs(companyId: string) {
  return useQuery({ queryKey: valuationKey(companyId), queryFn: () => fetchInputs(companyId) });
}
