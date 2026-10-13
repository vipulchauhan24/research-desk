import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyFormInput } from "@/lib/company";
import { supabase } from "@/lib/supabase/client";
import { COMPANIES_KEY } from "./use-companies";

// Postgres unique_violation, raised by unique (exchange, symbol).
const UNIQUE_VIOLATION = "23505";

export function useAddCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompanyFormInput) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: input.name,
          exchange: input.exchange,
          symbol: input.symbol,
          business_type: input.businessType,
          idea_source: input.ideaSource,
          status: input.status,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(
          error.code === UNIQUE_VIOLATION
            ? `${input.symbol} is already on your list for ${input.exchange}.`
            : "Couldn't add the company. Try again.",
        );
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}
