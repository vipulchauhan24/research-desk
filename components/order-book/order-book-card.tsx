import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RowTableCard } from "@/components/ui/row-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Column } from "@/components/ui/data-table";
import { formatCroreHeadline, formatMonth, formatNumber, formatPercent, PLACEHOLDER } from "@/lib/format";
import { paiseToCrore } from "@/lib/money";
import { orderBookAsOf, orderBookTotalPaise, orderShare, type OrderBookRow } from "@/lib/order-book";
import { useDeleteOrderBookRow } from "@/lib/queries/use-delete-order-book-row";
import { useOrderBook } from "@/lib/queries/use-order-book";
import { OrderBookDialog } from "./order-book-dialog";
import { SourceCell } from "./source-cell";

export function OrderBookCard({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const query = useOrderBook(companyId);
  const deleteRow = useDeleteOrderBookRow();
  const [dialogOpen, setDialogOpen] = useState(false);
  // null = adding a new order
  const [editing, setEditing] = useState<OrderBookRow | null>(null);

  const rows = query.data ?? [];
  const totalPaise = orderBookTotalPaise(rows);
  const asOf = orderBookAsOf(rows);
  const headline = asOf ? `${formatCroreHeadline(paiseToCrore(totalPaise))} as of ${formatMonth(asOf)}` : "No open orders";

  const columns: Column<OrderBookRow>[] = [
    { key: "customer", header: "Customer or segment", cell: (row) => <span className="font-medium text-slate-900">{row.customer}</span> },
    { key: "ordered", header: "Order month", cell: (row) => formatMonth(row.orderedOn) },
    { key: "value", header: "Value (₹ Cr)", align: "right", cell: (row) => formatNumber(paiseToCrore(row.valuePaise), 1) },
    {
      key: "share",
      header: "Share of total",
      align: "right",
      cell: (row) => {
        const share = orderShare(row, totalPaise);
        return share === null ? PLACEHOLDER : formatPercent(share);
      },
    },
    { key: "execution", header: "Execution by", cell: (row) => formatMonth(row.executionBy) },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "source", header: "Source document", cell: (row) => <SourceCell note={row.sourceNote} url={row.sourceUrl} /> },
  ];

  function openDialog(row: OrderBookRow | null) {
    setEditing(row);
    setDialogOpen(true);
  }

  const addButton = canEdit ? (
    <Button variant="secondary" size="sm" onClick={() => openDialog(null)}>
      Add order
    </Button>
  ) : undefined;

  return (
    <>
      <RowTableCard
        title="Order book"
        headline={headline}
        query={query}
        columns={columns}
        canEdit={canEdit}
        actions={addButton}
        emptyAction={addButton}
        emptyTitle="No orders yet"
        emptyDescription="Add the orders the company has announced, with their value and execution date."
        rowLabel={(row) => `${row.customer}, ${formatMonth(row.orderedOn)}`}
        deleteDescription="The order is removed from this company's order book and the total."
        onEdit={openDialog}
        onDelete={(row) => deleteRow.mutateAsync({ companyId, id: row.id })}
        deletePending={deleteRow.isPending}
      />
      <OrderBookDialog companyId={companyId} open={dialogOpen} onOpenChange={setDialogOpen} row={editing} />
    </>
  );
}
