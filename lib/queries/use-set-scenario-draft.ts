import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScenarioDraft } from "@/lib/scenarios-form";
import { supabase } from "@/lib/supabase/client";
import { scenarioKeys } from "./scenario-keys";
import type { StoredScenarioDraft } from "./use-scenario-draft";

interface SetScenarioDraftInput {
  companyId: string;
  draft: ScenarioDraft;
  basedOnVersion: number | null;
}

// Creates or overwrites the company's single draft. Used by autosave and by restoring a version.
export function useSetScenarioDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, draft, basedOnVersion }: SetScenarioDraftInput): Promise<StoredScenarioDraft> => {
      const { error } = await supabase.from("scenario_drafts").upsert({
        company_id: companyId,
        data: draft,
        based_on_version: basedOnVersion,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error("Couldn't save the draft.");
      return { draft, basedOnVersion };
    },
    // Write the cache directly rather than refetching, so a save can't hand the editor stale content back.
    onSuccess: (stored, { companyId }) => queryClient.setQueryData(scenarioKeys.draft(companyId), stored),
  });
}
