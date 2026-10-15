import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { valuationKey, type ValuationInputs } from "./use-valuation-inputs";

interface SaveValuationInputsInput {
  companyId: string;
  key: string;
  inputs: Json;
}

// One document per company and key: saving again replaces it.
export function useSaveValuationInputs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, key, inputs }: SaveValuationInputsInput) => {
      const { error } = await supabase
        .from("valuation_inputs")
        .upsert(
          { company_id: companyId, method: key, inputs, updated_at: new Date().toISOString() },
          { onConflict: "company_id,method" },
        );
      if (error) throw new Error("Couldn't save these inputs. Try again.");
    },
    // Write the cache directly: the form already holds exactly what was saved, so a refetch adds nothing.
    onSuccess: (_result, { companyId, key, inputs }) => {
      queryClient.setQueryData<ValuationInputs>(valuationKey(companyId), (current) => ({ ...current, [key]: inputs }));
    },
  });
}
