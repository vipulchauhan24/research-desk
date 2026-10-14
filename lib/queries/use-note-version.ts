import type { JSONContent } from "@tiptap/react";
import { useQuery } from "@tanstack/react-query";
import { parseDoc } from "@/lib/research";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export interface NoteVersionContent {
  version: number;
  content: JSONContent;
}

async function fetchVersion(versionId: string): Promise<NoteVersionContent> {
  const { data, error } = await supabase
    .from("note_versions")
    .select("version, content")
    .eq("id", versionId)
    .single();

  if (error) throw error;
  return { version: data.version, content: parseDoc(data.content) };
}

// Saved versions never change, so a fetched one can be cached for good.
export function useNoteVersion(versionId: string | null) {
  return useQuery({
    queryKey: researchKeys.version(versionId ?? ""),
    queryFn: () => fetchVersion(versionId as string),
    enabled: versionId !== null,
    staleTime: Infinity,
  });
}
