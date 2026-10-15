import { useMutation } from "@tanstack/react-query";
import type { CompanyDocument } from "@/lib/documents";
import { supabase } from "@/lib/supabase/client";

// The private bucket has no public URLs; a signed link works for a minute, long enough for the tab to load it.
const SIGNED_URL_SECONDS = 60;

// Resolves the address to open for a document: its link, or a fresh signed link to the stored PDF.
export function useOpenDocument() {
  return useMutation({
    mutationFn: async (document: CompanyDocument): Promise<string> => {
      if (document.url) return document.url;
      if (!document.file) throw new Error("This document has no file or link.");
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(document.file.path, SIGNED_URL_SECONDS);
      if (error) throw new Error("Couldn't open the file. Try again.");
      return data.signedUrl;
    },
  });
}
