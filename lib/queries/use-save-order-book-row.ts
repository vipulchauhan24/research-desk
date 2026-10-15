import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderBookValues } from "@/lib/order-book";
import { emptyToNull } from "@/lib/text";
import { supabase } from "@/lib/supabase/client";
import { orderBookKey } from "./use-order-book";

interface SaveOrderBookRowInput {
  companyId: string;
  // Present when editing; absent when adding.
  id?: string;
  values: OrderBookValues;
}

export function useSaveOrderBookRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, id, values }: SaveOrderBookRowInput) => {
      const row = {
        customer: values.customer,
        ordered_on: values.orderedOn,
        value_paise: values.value,
        execution_by: values.executionBy,
        status: values.status,
        source_note: emptyToNull(values.sourceNote),
        source_url: emptyToNull(values.sourceUrl),
      };
      const { error } = id
        ? await supabase.from("order_book_rows").update(row).eq("id", id)
        : await supabase.from("order_book_rows").insert({ ...row, company_id: companyId });
      if (error) throw new Error("Couldn't save the order. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: orderBookKey(companyId) }),
  });
}
