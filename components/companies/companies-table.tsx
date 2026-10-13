import { useRouter } from "next/router";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice, PLACEHOLDER } from "@/lib/format";
import type { CompanyListItem } from "@/lib/queries/use-companies";
import type { ReactNode } from "react";

const muted = (content: ReactNode) => <span className="text-slate-500">{content}</span>;

// Verdict and expected return come from the Scorecard and Scenarios features, which don't exist yet.
const COLUMNS: Column<CompanyListItem>[] = [
  {
    key: "company",
    header: "Company",
    cell: (company) => <span className="block min-w-48 font-medium text-slate-900">{company.name}</span>,
  },
  { key: "symbol", header: "Symbol", cell: (company) => muted(company.symbol) },
  { key: "ideaSource", header: "Idea source", cell: (company) => company.ideaSource },
  { key: "businessType", header: "Business type", cell: (company) => company.businessType },
  { key: "status", header: "Status", cell: (company) => <StatusBadge status={company.status} /> },
  { key: "verdict", header: "Latest scorecard verdict", cell: () => muted(PLACEHOLDER) },
  { key: "price", header: "Current price", align: "right", cell: (company) => formatPrice(company.pricePaise) },
  { key: "expectedReturn", header: "Expected return", align: "right", cell: () => muted(PLACEHOLDER) },
];

export function CompaniesTable({ companies, empty }: { companies: CompanyListItem[]; empty: ReactNode }) {
  const router = useRouter();

  return (
    <DataTable
      aria-label="Companies"
      columns={COLUMNS}
      rows={companies}
      getRowKey={(company) => company.id}
      onRowClick={(company) => void router.push(`/companies/${company.id}`)}
      empty={empty}
    />
  );
}
