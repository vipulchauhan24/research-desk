import { useQuery } from "@tanstack/react-query";
import { scenarioStoredSchema, type ScenarioStored } from "@/lib/scenarios-form";
import { supabase } from "@/lib/supabase/client";
import { scenarioKeys } from "./scenario-keys";

export interface ScenarioVersionData {
  version: number;
  scenario: ScenarioStored;
}

async function fetchVersion(versionId: string): Promise<ScenarioVersionData> {
  const { data, error } = await supabase.from("scenario_versions").select("version, data").eq("id", versionId).single();

  if (error) throw error;
  const parsed = scenarioStoredSchema.safeParse(data.data);
  if (!parsed.success) throw new Error("That version couldn't be read.");
  return { version: data.version, scenario: parsed.data };
}

// Saved versions never change, so a fetched one can be cached for good.
export function useScenarioVersion(versionId: string | null) {
  return useQuery({
    queryKey: scenarioKeys.version(versionId ?? ""),
    queryFn: () => fetchVersion(versionId as string),
    enabled: versionId !== null,
    staleTime: Infinity,
  });
}
