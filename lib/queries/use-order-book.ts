import { useQuery } from "@tanstack/react-query";
import { ORDER_STATUSES, type OrderBookRow, type OrderStatus } from "@/lib/order-book";
import { supabase } from "@/lib/supabase/client";

export const orderBookKey = (companyId: string) => ["order-book", companyId] as const;

// The column is free text guarded by a check constraint, so an unknown value can't come back; the fallback only
// satisfies the type.
function toStatus(value: string): OrderStatus {
  return ORDER_STATUSES.find((status) => status === value) ?? "Open";
}

async function fetchOrderBook(companyId: string): Promise<OrderBookRow[]> {
  const { data, error } = await supabase
    .from("order_book_rows")
    .select("id, customer, ordered_on, value_paise, execution_by, status, source_note, source_url")
    .eq("company_id", companyId)
    // Newest first; created_at and id break ties between orders from the same month.
    .order("ordered_on", { ascending: false })
    .order("created_at")
    .order("id");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    customer: row.customer,
    orderedOn: row.ordered_on,
    valuePaise: row.value_paise,
    executionBy: row.execution_by,
    status: toStatus(row.status),
    sourceNote: row.source_note,
    sourceUrl: row.source_url,
  }));
}

export function useOrderBook(companyId: string) {
  return useQuery({ queryKey: orderBookKey(companyId), queryFn: () => fetchOrderBook(companyId) });
}
