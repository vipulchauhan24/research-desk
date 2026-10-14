import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export interface NoteVersionSummary {
  id: string;
  version: number;
  changeNote: string;
  createdAt: string;
}

async function fetchVersions(companyId: string): Promise<NoteVersionSummary[]> {
  // Metadata only: the (large) content is fetched for one version at a time.
  const { data, error } = await supabase
    .from("note_versions")
    .select("id, version, change_note, created_at")
    .eq("company_id", companyId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    version: row.version,
    changeNote: row.change_note,
    createdAt: row.created_at,
  }));
}

export function useNoteVersions(companyId: string) {
  return useQuery({ queryKey: researchKeys.versions(companyId), queryFn: () => fetchVersions(companyId) });
}
