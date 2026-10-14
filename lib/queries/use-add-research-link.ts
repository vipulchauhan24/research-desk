import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

interface AddResearchLinkInput {
  companyId: string;
  label: string;
  url: string;
}

export function useAddResearchLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, label, url }: AddResearchLinkInput) => {
      const { error } = await supabase.from("research_links").insert({ company_id: companyId, label, url });
      if (error) throw new Error("Couldn't add the link. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: researchKeys.links(companyId) }),
  });
}
