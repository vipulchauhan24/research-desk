import { useMutation, useQueryClient } from "@tanstack/react-query";
import { newStoragePath, type DocumentMode, type DocumentValues } from "@/lib/documents";
import { supabase } from "@/lib/supabase/client";
import { emptyToNull } from "@/lib/text";
import { documentsKey } from "./use-documents";

const BUCKET = "documents";

interface SaveDocumentInput {
  companyId: string;
  // Present when editing; absent when adding.
  id?: string;
  mode: DocumentMode;
  values: DocumentValues;
}

// Adds a PDF (upload, then the row), adds a link, or edits the details of an existing document.
export function useSaveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, id, mode, values }: SaveDocumentInput) => {
      const details = {
        title: values.title,
        doc_type: values.type,
        period: emptyToNull(values.period),
        doc_date: values.date,
      };

      if (mode === "details" || (mode === "link" && id)) {
        const changes = mode === "link" ? { ...details, url: values.url } : details;
        const { error } = await supabase.from("documents").update(changes).eq("id", id as string);
        if (error) throw new Error("Couldn't save the document. Try again.");
        return;
      }

      if (mode === "link") {
        const { error } = await supabase.from("documents").insert({ ...details, company_id: companyId, url: values.url });
        if (error) throw new Error("Couldn't save the link. Try again.");
        return;
      }

      const file = values.file;
      if (!file) throw new Error("Choose a PDF file.");
      const path = newStoragePath(companyId);
      const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf" });
      if (upload.error) throw new Error("Couldn't upload the file. Try again.");

      const { error } = await supabase
        .from("documents")
        .insert({ ...details, company_id: companyId, storage_path: path, file_name: file.name });
      if (error) {
        // Don't leave an upload nothing points at.
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error("Couldn't save the document. Try again.");
      }
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: documentsKey(companyId) }),
  });
}
