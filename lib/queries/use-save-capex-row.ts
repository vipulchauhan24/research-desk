import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CapexValues } from "@/lib/order-book";
import { emptyToNull } from "@/lib/text";
import { supabase } from "@/lib/supabase/client";
import { capexKey } from "./use-capex";

interface SaveCapexRowInput {
  companyId: string;
  // Present when editing; absent when adding.
  id?: string;
  values: CapexValues;
}

export function useSaveCapexRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, id, values }: SaveCapexRowInput) => {
      const row = {
        project: values.project,
        capacity_added: emptyToNull(values.capacityAdded),
        outlay_paise: values.outlay,
        funding: emptyToNull(values.funding),
        status: values.status,
        commissioning_fy: values.commissioning.fiscalYear,
        commissioning_quarter: values.commissioning.quarter,
        source_note: emptyToNull(values.sourceNote),
        source_url: emptyToNull(values.sourceUrl),
      };
      const { error } = id
        ? await supabase.from("capex_rows").update(row).eq("id", id)
        : await supabase.from("capex_rows").insert({ ...row, company_id: companyId });
      if (error) throw new Error("Couldn't save the project. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: capexKey(companyId) }),
  });
}
