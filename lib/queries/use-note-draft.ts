import type { JSONContent } from "@tiptap/react";
import { useQuery } from "@tanstack/react-query";
import { parseDoc } from "@/lib/research";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export interface NoteDraft {
  content: JSONContent;
  basedOnVersion: number | null;
  updatedAt: string;
}

async function fetchDraft(companyId: string): Promise<NoteDraft | null> {
  const { data, error } = await supabase
    .from("note_drafts")
    .select("content, based_on_version, updated_at")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { content: parseDoc(data.content), basedOnVersion: data.based_on_version, updatedAt: data.updated_at };
}

// null data means "no draft"; the cache is kept in step by the draft mutations, so the editor never re-reads it mid-typing.
export function useNoteDraft(companyId: string) {
  return useQuery({ queryKey: researchKeys.draft(companyId), queryFn: () => fetchDraft(companyId) });
}
