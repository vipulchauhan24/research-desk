import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { trackerKey } from "./use-tracker";

export function useDeleteTrackerRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { companyId: string; id: string }) => {
      const { error } = await supabase.from("tracker_rows").delete().eq("id", id);
      if (error) throw new Error("Couldn't delete the metric. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: trackerKey(companyId) }),
  });
}
