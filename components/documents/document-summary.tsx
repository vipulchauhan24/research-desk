import { useId, useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { summarySchema, type CompanyDocument } from "@/lib/documents";
import { useSaveDocumentSummary } from "@/lib/queries/use-save-document-summary";

interface DocumentSummaryProps {
  companyId: string;
  document: CompanyDocument;
  // Mobile is read-only: the summary is shown as text.
  canEdit: boolean;
}

export function DocumentSummary({ companyId, document, canEdit }: DocumentSummaryProps) {
  const formId = useId();
  const saveSummary = useSaveDocumentSummary();
  // Read once: the form owns the text from here, and a refetch must not replace what is being typed.
  const [defaultValues] = useState(() => ({ summary: document.summary ?? "" }));
  const label = `Pasted summary · ${document.title}`;

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        await saveSummary.mutateAsync({ companyId, id: document.id, summary: summarySchema.parse(value).summary });
        // The saved text becomes the new baseline, so the form reads as unchanged until the next edit.
        formApi.reset(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the summary.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  if (!canEdit) {
    return (
      <div className="border-t border-slate-200 p-4">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <p className="mt-1 whitespace-pre-wrap text-slate-700">{document.summary ?? "No summary pasted."}</p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-3 border-t border-slate-200 p-4"
    >
      <form.AppField name="summary" validators={{ onChange: summarySchema.shape.summary }}>
        {(field) => <field.TextareaField label={label} placeholder="Paste the key points from this document" rows={8} />}
      </form.AppField>
      <form.AppForm>
        <div className="flex items-center gap-3">
          <form.SubmitButton label="Save summary" pendingLabel="Saving…" formId={formId} requireChanges />
          <form.FormError />
        </div>
      </form.AppForm>
    </form>
  );
}
