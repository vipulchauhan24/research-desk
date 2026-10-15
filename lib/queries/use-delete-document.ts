import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyDocument } from "@/lib/documents";
import { supabase } from "@/lib/supabase/client";
import { documentsKey } from "./use-documents";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ document }: { companyId: string; document: CompanyDocument }) => {
      const { error } = await supabase.from("documents").delete().eq("id", document.id);
      if (error) throw new Error("Couldn't delete the document. Try again.");
      // After the row, so a failure here leaves an unreferenced file rather than a document with no file.
      if (document.file) await supabase.storage.from("documents").remove([document.file.path]);
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: documentsKey(companyId) }),
  });
}
