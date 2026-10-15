import { useQuery } from "@tanstack/react-query";
import { DOCUMENT_TYPES, type CompanyDocument, type DocumentType } from "@/lib/documents";
import { supabase } from "@/lib/supabase/client";

export const documentsKey = (companyId: string) => ["documents", companyId] as const;

// The column is free text guarded by a check constraint, so an unknown value can't come back; the fallback only
// satisfies the type.
function toType(value: string): DocumentType {
  return DOCUMENT_TYPES.find((type) => type === value) ?? "Other";
}

async function fetchDocuments(companyId: string): Promise<CompanyDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, doc_type, period, doc_date, storage_path, file_name, url, summary")
    .eq("company_id", companyId)
    // Newest document first; created_at and id break ties between documents with the same date.
    .order("doc_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    type: toType(row.doc_type),
    period: row.period,
    date: row.doc_date,
    file: row.storage_path && row.file_name ? { path: row.storage_path, name: row.file_name } : null,
    url: row.url,
    summary: row.summary,
  }));
}

export function useDocuments(companyId: string) {
  return useQuery({ queryKey: documentsKey(companyId), queryFn: () => fetchDocuments(companyId) });
}
