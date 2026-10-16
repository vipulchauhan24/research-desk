import type { ReactNode } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { GridCalcCell } from "@/components/ui/grid-input";
import { computeCase, effectiveInputs, type CaseKey, type GridMode, type ScenarioMethod } from "@/lib/scenarios";
import { gridLabels, looseGrid, type GridDraft } from "@/lib/scenarios-form";
import { gridRows, isTyped, type GridRow } from "@/lib/scenarios-grid";

interface ScenarioGridProps {
  grid: GridDraft;
  mode: GridMode;
  method: ScenarioMethod;
  caseKey: CaseKey;
  // Draws the input for a typed cell. Omit for the read-only view, where every cell is plain text.
  renderInput?: (row: GridRow, periodIndex: number, isActual: boolean, periodLabel: string) => ReactNode;
}

export function ScenarioGrid({ grid, mode, method, caseKey, renderInput }: ScenarioGridProps) {
  const loose = looseGrid(grid, mode);
  const labels = gridLabels(loose);
  const inputs = effectiveInputs(caseKey, loose.cases, loose.actualCount);
  const computed = computeCase(method, mode, inputs, loose.actualCount);
  const periods = grid.cases[caseKey];

  const columns: Column<GridRow>[] = [
    {
      key: "item",
      header: "₹ Cr unless stated",
      cell: (row) => <span className="font-medium whitespace-nowrap text-slate-900">{row.label}</span>,
    },
    ...periods.map((period, index) => {
      const isActual = index < loose.actualCount;
      return {
        key: period.id,
        header: labels[index],
        align: "right" as const,
        cell: (row: GridRow) => {
          const text = row.text(computed[index], inputs[index]);
          if (!renderInput) return <span>{text}</span>;
          return isTyped(row, isActual) ? renderInput(row, index, isActual, labels[index]) : <GridCalcCell>{text}</GridCalcCell>;
        },
      };
    }),
  ];

  return <DataTable aria-label={`${mode} scenario`} columns={columns} rows={gridRows(method)} getRowKey={(row) => row.id} />;
}
