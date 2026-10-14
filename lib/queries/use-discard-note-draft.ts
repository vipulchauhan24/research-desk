import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export function useDiscardNoteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.from("note_drafts").delete().eq("company_id", companyId);
      if (error) throw new Error("Couldn't discard the draft. Try again.");
    },
    onSuccess: (_data, companyId) => queryClient.setQueryData(researchKeys.draft(companyId), null),
  });
}
