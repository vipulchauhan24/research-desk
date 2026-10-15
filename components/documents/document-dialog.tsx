import { useId, useLayoutEffect, useMemo } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  DOCUMENT_TYPES,
  documentDefaults,
  documentFormSchema,
  documentToDraft,
  type CompanyDocument,
  type DocumentMode,
} from "@/lib/documents";
import { useSaveDocument } from "@/lib/queries/use-save-document";

interface DocumentDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DocumentMode;
  // The document being edited, or null to add a new one.
  document: CompanyDocument | null;
}

const TYPE_ITEMS = DOCUMENT_TYPES.map((value) => ({ value, label: value }));

const TITLE: Record<DocumentMode, string> = { upload: "Upload PDF", link: "Add link", details: "Edit document" };

export function DocumentDialog({ companyId, open, onOpenChange, mode, document }: DocumentDialogProps) {
  const formId = useId();
  const saveDocument = useSaveDocument();
  const schema = useMemo(() => documentFormSchema(mode), [mode]);
  const submitLabel = document ? "Save document" : TITLE[mode];

  const form = useAppForm({
    defaultValues: document ? documentToDraft(document) : documentDefaults(),
    onSubmit: async ({ value, formApi }) => {
      // Re-parse for the transforms (trimmed text, https:// added to a bare address); validators only check.
      const values = schema.parse(value);
      try {
        await saveDocument.mutateAsync({ companyId, id: document?.id, mode, values });
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the document.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  // The parent opens this dialog by setting `open`, so reset here: every open starts from the document being
  // edited (or empty), never from a previous attempt.
  useLayoutEffect(() => {
    if (open) form.reset(document ? documentToDraft(document) : documentDefaults());
  }, [open, document, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={TITLE[mode]}
        description={
          mode === "upload"
            ? "A PDF kept privately with this company, such as a concall transcript or an annual report."
            : mode === "link"
              ? "A link to a document hosted elsewhere, such as an investor presentation."
              : "The PDF itself isn't changed."
        }
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label={submitLabel} pendingLabel={mode === "upload" ? "Uploading…" : "Saving…"} formId={formId} />
          </form.AppForm>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid grid-cols-2 gap-3"
        >
          {mode === "upload" && (
            <form.AppField name="file" validators={{ onChange: schema.shape.file }}>
              {(field) => <field.FileField label="PDF file" accept=".pdf,application/pdf" description="Up to 20 MB." className="col-span-2" />}
            </form.AppField>
          )}
          <form.AppField name="title" validators={{ onChange: schema.shape.title }}>
            {(field) => <field.TextField label="Title" placeholder="e.g. Q1 FY27 concall transcript" className="col-span-2" />}
          </form.AppField>
          {mode === "link" && (
            <form.AppField name="url" validators={{ onChange: schema.shape.url }}>
              {(field) => <field.TextField label="Web address" placeholder="https://example.com/presentation" className="col-span-2" />}
            </form.AppField>
          )}
          <form.AppField name="type" validators={{ onChange: schema.shape.type }}>
            {(field) => <field.SelectField label="Type" items={TYPE_ITEMS} placeholder="Choose a type" />}
          </form.AppField>
          <form.AppField name="period" validators={{ onChange: schema.shape.period }}>
            {(field) => <field.TextField label="Period (optional)" placeholder="e.g. Q1 FY27" />}
          </form.AppField>
          <form.AppField name="date" validators={{ onChange: schema.shape.date }}>
            {(field) => <field.TextField label="Document date" type="date" />}
          </form.AppField>
          <form.AppForm>
            <form.FormError className="col-span-2 text-xs text-red-600" />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
