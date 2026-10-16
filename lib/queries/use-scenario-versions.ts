import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { scenarioKeys } from "./scenario-keys";

export interface ScenarioVersionSummary {
  id: string;
  version: number;
  createdAt: string;
}

async function fetchVersions(companyId: string): Promise<ScenarioVersionSummary[]> {
  // Metadata only: the scenario itself is fetched for one version at a time.
  const { data, error } = await supabase
    .from("scenario_versions")
    .select("id, version, created_at")
    .eq("company_id", companyId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data.map((row) => ({ id: row.id, version: row.version, createdAt: row.created_at }));
}

export function useScenarioVersions(companyId: string) {
  return useQuery({ queryKey: scenarioKeys.versions(companyId), queryFn: () => fetchVersions(companyId) });
}
