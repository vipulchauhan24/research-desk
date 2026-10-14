import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export function useDeleteResearchLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { companyId: string; id: string }) => {
      const { error } = await supabase.from("research_links").delete().eq("id", id);
      if (error) throw new Error("Couldn't delete the link. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: researchKeys.links(companyId) }),
  });
}
