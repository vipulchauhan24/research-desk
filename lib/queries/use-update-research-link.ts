import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

interface UpdateResearchLinkInput {
  companyId: string;
  id: string;
  label: string;
  url: string;
}

export function useUpdateResearchLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label, url }: UpdateResearchLinkInput) => {
      const { error } = await supabase.from("research_links").update({ label, url }).eq("id", id);
      if (error) throw new Error("Couldn't save the link. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: researchKeys.links(companyId) }),
  });
}
