import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { capexKey } from "./use-capex";

export function useDeleteCapexRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { companyId: string; id: string }) => {
      const { error } = await supabase.from("capex_rows").delete().eq("id", id);
      if (error) throw new Error("Couldn't delete the project. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: capexKey(companyId) }),
  });
}
