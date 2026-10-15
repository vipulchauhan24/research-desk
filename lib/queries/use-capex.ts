import { useQuery } from "@tanstack/react-query";
import { CAPEX_STATUSES, type CapexRow, type CapexStatus } from "@/lib/order-book";
import { supabase } from "@/lib/supabase/client";

export const capexKey = (companyId: string) => ["capex", companyId] as const;

// See toStatus in use-order-book: the check constraint guarantees a known value.
function toStatus(value: string): CapexStatus {
  return CAPEX_STATUSES.find((status) => status === value) ?? "Planned";
}

async function fetchCapex(companyId: string): Promise<CapexRow[]> {
  const { data, error } = await supabase
    .from("capex_rows")
    .select(
      "id, project, capacity_added, outlay_paise, funding, status, commissioning_fy, commissioning_quarter, source_note, source_url",
    )
    .eq("company_id", companyId)
    // Soonest commissioning first.
    .order("commissioning_fy")
    .order("commissioning_quarter")
    .order("created_at")
    .order("id");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    project: row.project,
    capacityAdded: row.capacity_added,
    outlayPaise: row.outlay_paise,
    funding: row.funding,
    status: toStatus(row.status),
    commissioningFy: row.commissioning_fy,
    commissioningQuarter: row.commissioning_quarter,
    sourceNote: row.source_note,
    sourceUrl: row.source_url,
  }));
}

export function useCapex(companyId: string) {
  return useQuery({ queryKey: capexKey(companyId), queryFn: () => fetchCapex(companyId) });
}
