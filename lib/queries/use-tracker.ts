import { useQuery } from "@tanstack/react-query";
import { TRACKER_CASES, TRACKER_UNITS, type TrackerCase, type TrackerRow, type TrackerUnit } from "@/lib/tracker";
import { supabase } from "@/lib/supabase/client";

export const trackerKey = (companyId: string) => ["tracker", companyId] as const;

// Free text guarded by check constraints; the fallbacks only satisfy the types.
const toUnit = (value: string): TrackerUnit => TRACKER_UNITS.find((unit) => unit === value) ?? "crore";
const toCase = (value: string): TrackerCase => TRACKER_CASES.find((name) => name === value) ?? "Base";

async function fetchTracker(companyId: string): Promise<TrackerRow[]> {
  const { data, error } = await supabase
    .from("tracker_rows")
    .select("id, fiscal_year, quarter, metric, unit, case_name, predicted, actual")
    .eq("company_id", companyId)
    // Rows keep the order they were added in within a quarter; id breaks ties.
    .order("created_at")
    .order("id");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    fiscalYear: row.fiscal_year,
    quarter: row.quarter,
    metric: row.metric,
    unit: toUnit(row.unit),
    case: toCase(row.case_name),
    predicted: row.predicted,
    actual: row.actual,
  }));
}

export function useTracker(companyId: string) {
  return useQuery({ queryKey: trackerKey(companyId), queryFn: () => fetchTracker(companyId) });
}
