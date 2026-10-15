import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/ui/data-table";
import { RowTableCard } from "@/components/ui/row-table-card";
import { formatDate, PLACEHOLDER } from "@/lib/format";
import type { CompanyDocument, DocumentMode } from "@/lib/documents";
import { useDeleteDocument } from "@/lib/queries/use-delete-document";
import { useDocuments } from "@/lib/queries/use-documents";
import { DocumentDialog } from "./document-dialog";
import { DocumentSource } from "./document-source";
import { DocumentSummary } from "./document-summary";

export function DocumentsCard({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const query = useDocuments(companyId);
  const deleteDocument = useDeleteDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DocumentMode>("upload");
  // null = adding a new document
  const [editing, setEditing] = useState<CompanyDocument | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const documents = query.data ?? [];
  // The summary shown belongs to the clicked row, or to the newest document until one is clicked.
  const selected = documents.find((document) => document.id === selectedId) ?? documents[0] ?? null;

  const columns: Column<CompanyDocument>[] = [
    { key: "title", header: "Title", cell: (row) => <span className="font-medium text-slate-900">{row.title}</span> },
    { key: "type", header: "Type", cell: (row) => <Badge>{row.type}</Badge> },
    { key: "period", header: "Period", cell: (row) => row.period ?? PLACEHOLDER },
    { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { key: "source", header: "Source", cell: (row) => <DocumentSource document={row} onError={setOpenError} /> },
  ];

  function openDialog(nextMode: DocumentMode, document: CompanyDocument | null) {
    setMode(nextMode);
    setEditing(document);
    setDialogOpen(true);
  }

  const addButtons = canEdit ? (
    <>
      <Button variant="secondary" size="sm" onClick={() => openDialog("link", null)}>
        Add link
      </Button>
      <Button size="sm" onClick={() => openDialog("upload", null)}>
        Upload PDF
      </Button>
    </>
  ) : undefined;

  return (
    <>
      <RowTableCard
        title="Documents"
        headline={documents.length > 0 ? `${documents.length} ${documents.length === 1 ? "document" : "documents"}` : "None yet"}
        query={query}
        columns={columns}
        canEdit={canEdit}
        actions={addButtons}
        emptyAction={addButtons}
        emptyTitle="No documents yet"
        emptyDescription="Upload concall transcripts, results and annual reports, or add a link to a presentation."
        rowLabel={(row) => row.title}
        deleteDescription="The document and its summary are deleted, along with the uploaded file if there is one. This can't be undone."
        onEdit={(row) => openDialog(row.url ? "link" : "details", row)}
        onDelete={(row) => deleteDocument.mutateAsync({ companyId, document: row })}
        deletePending={deleteDocument.isPending}
        onRowClick={(row) => setSelectedId(row.id)}
        selectedRowKey={selected?.id}
      >
        {openError && (
          <p role="alert" className="border-t border-slate-100 px-4 py-2 text-red-600">
            {openError}
          </p>
        )}
        {selected && <DocumentSummary key={selected.id} companyId={companyId} document={selected} canEdit={canEdit} />}
      </RowTableCard>
      <DocumentDialog companyId={companyId} open={dialogOpen} onOpenChange={setDialogOpen} mode={mode} document={editing} />
    </>
  );
}
