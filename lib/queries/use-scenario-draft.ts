import { useQuery } from "@tanstack/react-query";
import { scenarioDraftSchema, type ScenarioDraft } from "@/lib/scenarios-form";
import { supabase } from "@/lib/supabase/client";
import { scenarioKeys } from "./scenario-keys";

export interface StoredScenarioDraft {
  draft: ScenarioDraft;
  basedOnVersion: number | null;
}

async function fetchDraft(companyId: string): Promise<StoredScenarioDraft | null> {
  const { data, error } = await supabase
    .from("scenario_drafts")
    .select("data, based_on_version")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const parsed = scenarioDraftSchema.safeParse(data.data);
  if (!parsed.success) throw new Error("The saved draft couldn't be read.");
  return { draft: parsed.data, basedOnVersion: data.based_on_version };
}

// null data means "no draft"; the cache is kept in step by the draft mutations, so the editor never re-reads it mid-typing.
export function useScenarioDraft(companyId: string) {
  return useQuery({ queryKey: scenarioKeys.draft(companyId), queryFn: () => fetchDraft(companyId) });
}
