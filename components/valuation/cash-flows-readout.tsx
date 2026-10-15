import { formatFiscalYear, formatNumber } from "@/lib/format";
import { paiseToCrore } from "@/lib/money";
import { storedCashFlowYears, type StoredCashFlows } from "@/lib/valuation-base-case";
import { cashFlowCalcRows, type DcfKind, type DiscountAssumptions } from "@/lib/valuation-cash-flow-table";
import { CashFlowGrid } from "./cash-flow-grid";

interface CashFlowsReadoutProps {
  saved: StoredCashFlows;
  kind: DcfKind;
  discount: DiscountAssumptions | null;
}

// Mobile is read-only: the saved cash flows in the same grid, as text.
export function CashFlowsReadout({ saved, kind, discount }: CashFlowsReadoutProps) {
  const years = saved.years.map((_, index) => ({
    id: `year-${index}`,
    label: formatFiscalYear(saved.firstFiscalYear + index, true),
  }));

  return (
    <CashFlowGrid
      years={years}
      calcRows={cashFlowCalcRows(kind, storedCashFlowYears(saved), saved.taxRate, discount)}
      renderInput={(key, index) => (
        <span className="text-slate-900">{formatNumber(paiseToCrore(saved.years[index][key]), 1)}</span>
      )}
    />
  );
}
