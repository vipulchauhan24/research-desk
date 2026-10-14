import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { researchKeys } from "./research-keys";

export interface ResearchLink {
  id: string;
  label: string;
  url: string;
}

async function fetchLinks(companyId: string): Promise<ResearchLink[]> {
  const { data, error } = await supabase
    .from("research_links")
    .select("id, label, url")
    .eq("company_id", companyId)
    // Shown in the order they were added; id breaks ties between links saved in the same instant.
    .order("created_at")
    .order("id");

  if (error) throw error;
  return data;
}

export function useResearchLinks(companyId: string) {
  return useQuery({ queryKey: researchKeys.links(companyId), queryFn: () => fetchLinks(companyId) });
}
