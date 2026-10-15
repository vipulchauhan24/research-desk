import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { emptyToNull } from "@/lib/text";
import { documentsKey } from "./use-documents";

interface SaveDocumentSummaryInput {
  companyId: string;
  id: string;
  summary: string;
}

export function useSaveDocumentSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, summary }: SaveDocumentSummaryInput) => {
      const { error } = await supabase.from("documents").update({ summary: emptyToNull(summary.trim()) }).eq("id", id);
      if (error) throw new Error("Couldn't save the summary. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: documentsKey(companyId) }),
  });
}
