import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScenarioStored } from "@/lib/scenarios-form";
import { supabase } from "@/lib/supabase/client";
import { scenarioKeys } from "./scenario-keys";

interface SaveScenarioVersionInput {
  companyId: string;
  scenario: ScenarioStored;
}

// Saves the validated scenario as the next version and clears the draft in one database transaction
// (see save_scenario_version).
export function useSaveScenarioVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, scenario }: SaveScenarioVersionInput) => {
      const { data, error } = await supabase.rpc("save_scenario_version", { p_company_id: companyId, p_data: scenario });
      if (error) throw new Error("Couldn't save the version. Try again.");
      return data;
    },
    onSuccess: async (_version, { companyId }) => {
      queryClient.setQueryData(scenarioKeys.draft(companyId), null);
      await queryClient.invalidateQueries({ queryKey: scenarioKeys.versions(companyId) });
    },
  });
}
