import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// Returns a checker for form validators, which run outside React's render and so can't call a hook themselves.
export function useCompanyExists() {
  const queryClient = useQueryClient();

  return (exchange: string, symbol: string) =>
    queryClient.query({
      queryKey: ["company-exists", exchange, symbol],
      // A cached "free" answer goes stale the moment someone adds the symbol, so always ask the DB.
      staleTime: 0,
      queryFn: async () => {
        const { count, error } = await supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("exchange", exchange)
          .eq("symbol", symbol);
        if (error) throw error;
        return (count ?? 0) > 0;
      },
    });
}
