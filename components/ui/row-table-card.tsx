import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { ConfirmDialog } from "./confirm-dialog";
import { DataTable, type Column } from "./data-table";
import { EmptyState } from "./empty-state";
import { MoreIcon } from "./icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";

interface RowTableCardProps<T extends { id: string }> {
  title: string;
  // Shown after the title, e.g. "₹ 1,420 Cr as of Jun 2026".
  headline: ReactNode;
  query: { data: T[] | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
  columns: Column<T>[];
  // Mobile is read-only: no row actions.
  canEdit: boolean;
  // Header controls on the right (Add buttons, a filter). Pass only what the current device may show.
  actions?: ReactNode;
  // Offered in the empty state, usually the same Add button.
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  // Content under the table, inside the card.
  children?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  // Names a row for the action menu and the delete confirmation.
  rowLabel: (row: T) => string;
  deleteDescription: string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => Promise<void>;
  deletePending: boolean;
}

export function RowTableCard<T extends { id: string }>({
  title,
  headline,
  query,
  columns,
  canEdit,
  actions,
  emptyAction,
  onRowClick,
  selectedRowKey,
  children,
  emptyTitle,
  emptyDescription,
  rowLabel,
  deleteDescription,
  onEdit,
  onDelete,
  deletePending,
}: RowTableCardProps<T>) {
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: rows, isPending, isError, refetch } = query;

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await onDelete(deleting);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete the row.");
    }
    setDeleting(null);
  }

  const actionsColumn: Column<T> = {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    align: "right",
    cell: (row) => (
      <Menu>
        <MenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${rowLabel(row)}`} />}>
          <MoreIcon />
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => onEdit(row)}>Edit</MenuItem>
          <MenuItem destructive onClick={() => setDeleting(row)}>
            Delete
          </MenuItem>
        </MenuContent>
      </Menu>
    ),
  };

  return (
    <Card aria-label={title}>
      <CardHeader className="flex-wrap">
        <span>
          {title} <span className="font-normal text-slate-500">· {headline}</span>
        </span>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>

      {isPending ? (
        <p className="px-4 py-10 text-center text-slate-500" role="status">
          Loading {title.toLowerCase()}…
        </p>
      ) : isError || !rows ? (
        <EmptyState
          title={`Couldn't load the ${title.toLowerCase()}`}
          description="Check your connection and try again."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <DataTable
          aria-label={title}
          columns={canEdit ? [...columns, actionsColumn] : columns}
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={onRowClick}
          selectedRowKey={selectedRowKey}
          empty={<EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}
        />
      )}
      {children}
      {deleteError && (
        <p role="alert" className="border-t border-slate-100 px-4 py-2 text-red-600">
          {deleteError}
        </p>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting ? rowLabel(deleting) : ""}"?`}
        description={deleteDescription}
        pending={deletePending}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
