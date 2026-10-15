import { useState } from "react";
import type { Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { RowTableCard } from "@/components/ui/row-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCroreHeadline, formatFiscalQuarter, formatNumber, PLACEHOLDER } from "@/lib/format";
import { paiseToCrore } from "@/lib/money";
import { capexTotalPaise, type CapexRow } from "@/lib/order-book";
import { useCapex } from "@/lib/queries/use-capex";
import { useDeleteCapexRow } from "@/lib/queries/use-delete-capex-row";
import { CapexDialog } from "./capex-dialog";
import { SourceCell } from "./source-cell";

const COLUMNS: Column<CapexRow>[] = [
  { key: "project", header: "Project", cell: (row) => <span className="font-medium text-slate-900">{row.project}</span> },
  { key: "capacity", header: "Capacity added", cell: (row) => row.capacityAdded ?? PLACEHOLDER },
  { key: "outlay", header: "Outlay (₹ Cr)", align: "right", cell: (row) => formatNumber(paiseToCrore(row.outlayPaise), 1) },
  { key: "funding", header: "Funding source", cell: (row) => row.funding ?? PLACEHOLDER },
  { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    key: "commissioning",
    header: "Expected commissioning",
    cell: (row) => formatFiscalQuarter(row.commissioningFy, row.commissioningQuarter),
  },
  { key: "source", header: "Source document", cell: (row) => <SourceCell note={row.sourceNote} url={row.sourceUrl} /> },
];

export function CapexCard({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const query = useCapex(companyId);
  const deleteRow = useDeleteCapexRow();
  const [dialogOpen, setDialogOpen] = useState(false);
  // null = adding a new project
  const [editing, setEditing] = useState<CapexRow | null>(null);

  const rows = query.data ?? [];
  const headline = rows.length > 0 ? `${formatCroreHeadline(paiseToCrore(capexTotalPaise(rows)))} planned` : "No projects";

  function openDialog(row: CapexRow | null) {
    setEditing(row);
    setDialogOpen(true);
  }

  const addButton = canEdit ? (
    <Button variant="secondary" size="sm" onClick={() => openDialog(null)}>
      Add project
    </Button>
  ) : undefined;

  return (
    <>
      <RowTableCard
        title="Capex"
        headline={headline}
        query={query}
        columns={COLUMNS}
        canEdit={canEdit}
        actions={addButton}
        emptyAction={addButton}
        emptyTitle="No capex projects yet"
        emptyDescription="Add the projects the company has announced, with their outlay and commissioning quarter."
        rowLabel={(row) => row.project}
        deleteDescription="The project is removed from this company's capex and the planned total."
        onEdit={openDialog}
        onDelete={(row) => deleteRow.mutateAsync({ companyId, id: row.id })}
        deletePending={deleteRow.isPending}
      />
      <CapexDialog companyId={companyId} open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />
    </>
  );
}
