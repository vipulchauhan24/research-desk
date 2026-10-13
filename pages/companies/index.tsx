import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompaniesTable } from "@/components/companies/companies-table";
import { useCompanyFilters } from "@/components/companies/use-company-filters";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { COMPANY_STATUSES, IDEA_SOURCES, filterCompanies } from "@/lib/company";
import { useCompanies } from "@/lib/queries/use-companies";

const STATUS_OPTIONS = ["All", ...COMPANY_STATUSES];
const SOURCE_ITEMS = ["All", ...IDEA_SOURCES].map((value) => ({ value, label: value }));

export default function CompaniesPage() {
  const { data: companies, isPending, isError, refetch } = useCompanies();
  const { isReady, filters, isFiltered, setQuery, setStatus, setIdeaSource, clear } = useCompanyFilters();

  const visible = companies && filterCompanies(companies, filters);

  return (
    <AppShell
      title="Companies"
      subtitle={companies && `${visible?.length ?? 0} of ${companies.length} companies`}
      action={<AddCompanyDialog />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="search"
            aria-label="Search companies by name or symbol"
            placeholder="Search name or symbol"
            value={filters.query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full md:w-70 max-md:h-11"
          />
          <ToggleGroup aria-label="Filter by status" value={filters.status} onValueChange={setStatus}>
            {STATUS_OPTIONS.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {status}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            aria-label="Filter by idea source"
            items={SOURCE_ITEMS}
            value={filters.ideaSource}
            onValueChange={(value) => setIdeaSource(value ?? "All")}
            className="w-40 max-md:h-11"
          />
        </div>

        <Card>
          {isPending || !isReady ? (
            <p className="px-4 py-10 text-center text-slate-500" role="status">
              Loading companies…
            </p>
          ) : isError ? (
            <EmptyState
              title="Couldn't load companies"
              description="Check your connection and try again."
              action={
                <Button variant="secondary" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <CompaniesTable
              companies={visible ?? []}
              empty={
                isFiltered ? (
                  <EmptyState
                    title="No companies match these filters"
                    description="Try a different search or clear the filters."
                    action={
                      <Button variant="secondary" onClick={clear}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    title="No companies yet"
                    description="Add the first stock you want to research."
                    action={
                      <div className="hidden md:block">
                        <AddCompanyDialog />
                      </div>
                    }
                  />
                )
              }
            />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
