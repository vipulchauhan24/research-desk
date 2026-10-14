import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todayIso } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";
import { COMPANIES_KEY } from "./use-companies";

interface SetCompanyPriceInput {
  companyId: string;
  pricePaise: number;
}

// One entry per company per day: entering again on the same day corrects it, a later day adds history.
export function useSetCompanyPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, pricePaise }: SetCompanyPriceInput) => {
      const { error } = await supabase
        .from("price_entries")
        .upsert(
          { company_id: companyId, price_paise: pricePaise, as_of: todayIso() },
          { onConflict: "company_id,as_of" },
        );
      if (error) throw new Error("Couldn't save the price. Try again.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}
