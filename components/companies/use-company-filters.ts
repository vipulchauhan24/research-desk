import { useRouter } from "next/router";
import { useState } from "react";
import { COMPANY_STATUSES, IDEA_SOURCES, type CompanyFilters } from "@/lib/company";

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function oneOf<T extends string>(options: readonly T[], value: string): T | "All" {
  return options.find((option) => option === value) ?? "All";
}

// Filters live in the URL so they survive refresh and can be shared. The search box keeps its own
// draft so typing isn't tied to the router's async update (which would make the caret jump).
export function useCompanyFilters() {
  const router = useRouter();
  const urlQuery = first(router.query.q);
  const [draft, setDraft] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);

  // router.query is empty until isReady, and also changes on back/forward; follow it when it moves.
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    setDraft(urlQuery);
  }

  const filters: CompanyFilters = {
    query: draft,
    status: oneOf(COMPANY_STATUSES, first(router.query.status)),
    ideaSource: oneOf(IDEA_SOURCES, first(router.query.source)),
  };

  function update(next: Partial<Record<"q" | "status" | "source", string>>) {
    const query: Record<string, string | string[] | undefined> = { ...router.query, ...next };
    // Keep URLs clean: omit params that are at their default.
    for (const [key, value] of Object.entries(query)) {
      if (value === "" || value === "All") delete query[key];
    }
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
  }

  return {
    isReady: router.isReady,
    filters,
    isFiltered: filters.query.trim() !== "" || filters.status !== "All" || filters.ideaSource !== "All",
    setQuery(value: string) {
      setDraft(value);
      update({ q: value });
    },
    setStatus: (value: string) => update({ status: value }),
    setIdeaSource: (value: string) => update({ source: value }),
    clear() {
      setDraft("");
      update({ q: "", status: "", source: "" });
    },
  };
}
