import type { JSONContent } from "@tiptap/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";
import type { NoteDraft } from "./use-note-draft";

interface SetNoteDraftInput {
  companyId: string;
  content: JSONContent;
  basedOnVersion: number | null;
}

// Creates or overwrites the company's single draft. Used by autosave, restore and upload.
export function useSetNoteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, content, basedOnVersion }: SetNoteDraftInput): Promise<NoteDraft> => {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase.from("note_drafts").upsert({
        company_id: companyId,
        content,
        based_on_version: basedOnVersion,
        updated_at: updatedAt,
      });
      if (error) throw new Error("Couldn't save the draft.");
      return { content, basedOnVersion, updatedAt };
    },
    // Write the cache directly rather than refetching, so a save can't hand the editor stale content back.
    onSuccess: (draft, { companyId }) => queryClient.setQueryData(researchKeys.draft(companyId), draft),
  });
}
