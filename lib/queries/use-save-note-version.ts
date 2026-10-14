import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

interface SaveNoteVersionInput {
  companyId: string;
  changeNote: string;
}

// Promotes the draft to the next saved version in one database transaction (see save_note_version).
export function useSaveNoteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, changeNote }: SaveNoteVersionInput) => {
      const { data, error } = await supabase.rpc("save_note_version", {
        p_company_id: companyId,
        p_change_note: changeNote,
      });
      if (error) throw new Error("Couldn't save the version. Try again.");
      return data;
    },
    onSuccess: async (_version, { companyId }) => {
      queryClient.setQueryData(researchKeys.draft(companyId), null);
      await queryClient.invalidateQueries({ queryKey: researchKeys.versions(companyId) });
    },
  });
}
