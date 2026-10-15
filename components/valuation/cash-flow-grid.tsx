import type { ReactNode } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { GridCalcCell } from "@/components/ui/grid-input";
import { CASH_FLOW_ROWS, type CashFlowKey } from "@/lib/valuation-base-case";
import type { CalcRow } from "@/lib/valuation-cash-flow-table";

interface GridYear {
  id: string;
  label: string;
}

type GridRow =
  | { kind: "input"; id: string; label: string; key: CashFlowKey }
  | ({ kind: "calc" } & CalcRow);

interface CashFlowGridProps {
  years: GridYear[];
  calcRows: CalcRow[];
  // An input cell for the editor, or plain text for the read-only view.
  renderInput: (key: CashFlowKey, yearIndex: number) => ReactNode;
}

const DASH = <span className="text-slate-400">—</span>;

export function CashFlowGrid({ years, calcRows, renderInput }: CashFlowGridProps) {
  const rows: GridRow[] = [
    ...CASH_FLOW_ROWS.map((row) => ({ kind: "input" as const, id: row.key, label: row.label, key: row.key })),
    ...calcRows.map((row) => ({ kind: "calc" as const, ...row })),
  ];

  const columns: Column<GridRow>[] = [
    {
      key: "item",
      header: "₹ Cr",
      cell: (row) => <span className="font-medium whitespace-nowrap text-slate-900">{row.label}</span>,
    },
    ...years.map((year, index) => ({
      key: year.id,
      header: year.label,
      align: "right" as const,
      cell: (row: GridRow) =>
        row.kind === "input" ? renderInput(row.key, index) : <GridCalcCell>{row.cells[index]}</GridCalcCell>,
    })),
    {
      key: "terminal",
      header: "Terminal",
      align: "right",
      cell: (row) => (row.kind === "calc" && row.terminal !== "—" ? <GridCalcCell>{row.terminal}</GridCalcCell> : DASH),
    },
  ];

  return <DataTable aria-label="Base-case cash flows" columns={columns} rows={rows} getRowKey={(row) => row.id} />;
}
