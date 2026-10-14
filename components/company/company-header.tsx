import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CompanyListItem } from "@/lib/queries/use-companies";
import { CurrentPriceCard } from "./current-price-card";

export function CompanyHeader({ company }: { company: CompanyListItem }) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
      <div>
        <nav aria-label="Breadcrumb" className="mb-1 text-xs text-slate-500">
          <Link href="/companies" className="rounded text-indigo-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
            Companies
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{company.name}</span>
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>
          <StatusBadge status={company.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 text-slate-500">
          <span>
            {company.exchange}: <span className="font-medium text-slate-700">{company.symbol}</span>
          </span>
          <span>{company.businessType}</span>
          <span>Idea source: {company.ideaSource}</span>
        </div>
      </div>
      <CurrentPriceCard company={company} />
    </div>
  );
}
