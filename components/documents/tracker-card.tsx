import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/ui/data-table";
import { RowTableCard } from "@/components/ui/row-table-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatSignedPercent, PLACEHOLDER } from "@/lib/format";
import { useDeleteTrackerRow } from "@/lib/queries/use-delete-tracker-row";
import { useTracker } from "@/lib/queries/use-tracker";
import {
  formatTrackerValue,
  quarterId,
  quarterLabel,
  trackedQuarters,
  type QuarterKey,
  type TrackerRow,
} from "@/lib/tracker";
import { MATCH_BAND_PCT, SLIGHT_MISS_BAND_PCT, variancePct, verdictFor } from "@/lib/verdict";
import { TrackerDialog } from "./tracker-dialog";

const COLUMNS: Column<TrackerRow>[] = [
  { key: "metric", header: "Metric", cell: (row) => <span className="font-medium text-slate-900">{row.metric}</span> },
  { key: "case", header: "Case", cell: (row) => row.case },
  { key: "predicted", header: "Predicted", align: "right", cell: (row) => formatTrackerValue(row.unit, row.predicted) },
  {
    key: "actual",
    header: "Actual",
    align: "right",
    cell: (row) => (row.actual === null ? PLACEHOLDER : formatTrackerValue(row.unit, row.actual)),
  },
  {
    key: "variance",
    header: "Variance",
    align: "right",
    cell: (row) => {
      const variance = row.actual === null ? null : variancePct(row.predicted, row.actual);
      return variance === null ? PLACEHOLDER : formatSignedPercent(variance);
    },
  },
  {
    key: "verdict",
    header: "Verdict",
    cell: (row) => {
      const verdict = row.actual === null ? null : verdictFor(row.predicted, row.actual);
      return verdict ? <StatusBadge status={verdict} /> : PLACEHOLDER;
    },
  },
];

export function TrackerCard({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const query = useTracker(companyId);
  const deleteRow = useDeleteTrackerRow();
  const [dialogOpen, setDialogOpen] = useState(false);
  // null = adding a new metric
  const [editing, setEditing] = useState<TrackerRow | null>(null);
  const [chosenQuarter, setChosenQuarter] = useState<string | null>(null);

  const quarters = trackedQuarters(query.data ?? []);
  // The chosen quarter, or the newest one with metrics until another is picked.
  const quarter: QuarterKey | null = quarters.find((candidate) => quarterId(candidate) === chosenQuarter) ?? quarters[0] ?? null;
  const rows = (query.data ?? []).filter((row) => quarter && quarterId(row) === quarterId(quarter));

  function openDialog(row: TrackerRow | null) {
    setEditing(row);
    setDialogOpen(true);
  }

  const addButton = canEdit ? (
    <Button variant="secondary" onClick={() => openDialog(null)}>
      Add metric
    </Button>
  ) : undefined;

  const actions = (
    <>
      {quarters.length > 0 && (
        <Select
          aria-label="Quarter"
          className="w-32 max-md:h-11"
          items={quarters.map((candidate) => ({ value: quarterId(candidate), label: quarterLabel(candidate) }))}
          value={quarter ? quarterId(quarter) : null}
          onValueChange={setChosenQuarter}
        />
      )}
      {addButton}
    </>
  );

  return (
    <>
      <RowTableCard
        title="Predicted vs actual"
        headline={quarter ? quarterLabel(quarter) : "No quarter yet"}
        query={{ data: query.data && rows, isPending: query.isPending, isError: query.isError, refetch: query.refetch }}
        columns={COLUMNS}
        canEdit={canEdit}
        actions={actions}
        emptyAction={addButton}
        emptyTitle="No metrics tracked yet"
        emptyDescription="Add what you predicted for a quarter, then fill in the actuals when the company reports."
        rowLabel={(row) => `${row.metric} (${row.case}), ${quarterLabel(row)}`}
        deleteDescription="The metric is removed from this quarter's tracker, and its verdict with it."
        onEdit={openDialog}
        onDelete={(row) => deleteRow.mutateAsync({ companyId, id: row.id })}
        deletePending={deleteRow.isPending}
      >
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          Variance = (actual − predicted) ÷ predicted · Match within ±{MATCH_BAND_PCT}% · Slight miss {MATCH_BAND_PCT}–
          {SLIGHT_MISS_BAND_PCT}% · Miss beyond {SLIGHT_MISS_BAND_PCT}%
        </p>
      </RowTableCard>
      <TrackerDialog
        companyId={companyId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editing}
        defaultQuarter={quarter}
        onSaved={(saved) => setChosenQuarter(quarterId(saved))}
      />
    </>
  );
}
