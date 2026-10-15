import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { orderBookKey } from "./use-order-book";

export function useDeleteOrderBookRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { companyId: string; id: string }) => {
      const { error } = await supabase.from("order_book_rows").delete().eq("id", id);
      if (error) throw new Error("Couldn't delete the order. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: orderBookKey(companyId) }),
  });
}
