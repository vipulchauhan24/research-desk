import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TrackerValues } from "@/lib/tracker";
import { trackerKey } from "./use-tracker";

interface SaveTrackerRowInput {
  companyId: string;
  // Present when editing; absent when adding.
  id?: string;
  values: TrackerValues;
}

// Postgres unique_violation: this metric and case already exist for the quarter.
const UNIQUE_VIOLATION = "23505";

export function useSaveTrackerRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, id, values }: SaveTrackerRowInput) => {
      const row = {
        fiscal_year: values.quarter.fiscalYear,
        quarter: values.quarter.quarter,
        metric: values.metric,
        unit: values.unit,
        case_name: values.case,
        predicted: values.predicted,
        actual: values.actual,
      };
      const { error } = id
        ? await supabase.from("tracker_rows").update(row).eq("id", id)
        : await supabase.from("tracker_rows").insert({ ...row, company_id: companyId });
      if (error?.code === UNIQUE_VIOLATION) {
        throw new Error(`There's already a ${values.case} row for ${values.metric} in that quarter. Edit it instead.`);
      }
      if (error) throw new Error("Couldn't save the metric. Try again.");
    },
    onSuccess: (_data, { companyId }) => queryClient.invalidateQueries({ queryKey: trackerKey(companyId) }),
  });
}
