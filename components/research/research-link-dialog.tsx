import { useId, useLayoutEffect } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useAddResearchLink } from "@/lib/queries/use-add-research-link";
import type { ResearchLink } from "@/lib/queries/use-research-links";
import { useUpdateResearchLink } from "@/lib/queries/use-update-research-link";
import { resourceLinkSchema, type ResourceLinkDraft } from "@/lib/research";

interface ResearchLinkDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The link being edited, or null to add a new one.
  link: ResearchLink | null;
}

export function ResearchLinkDialog({ companyId, open, onOpenChange, link }: ResearchLinkDialogProps) {
  const formId = useId();
  const addLink = useAddResearchLink();
  const updateLink = useUpdateResearchLink();
  const defaultValues: ResourceLinkDraft = { label: link?.label ?? "", url: link?.url ?? "" };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      // Re-parse to apply the transforms (trimmed label, https:// added to a bare address).
      const parsed = resourceLinkSchema.parse(value);
      try {
        if (link) await updateLink.mutateAsync({ companyId, id: link.id, ...parsed });
        else await addLink.mutateAsync({ companyId, ...parsed });
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the link.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  // The parent opens this dialog by setting `open`, which the dialog does not report through onOpenChange,
  // so reset here: every open starts from the link being edited (or empty), never from a previous attempt.
  useLayoutEffect(() => {
    if (open) form.reset({ label: link?.label ?? "", url: link?.url ?? "" });
  }, [open, link, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={link ? "Edit link" : "Add link"}
        description="A link to an external resource, such as a filing, an article or a presentation."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label={link ? "Save link" : "Add link"} pendingLabel="Saving…" formId={formId} />
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
          className="flex flex-col gap-3"
        >
          <form.AppField name="label" validators={{ onChange: resourceLinkSchema.shape.label }}>
            {(field) => <field.TextField label="Label" placeholder="e.g. Q2 FY27 concall transcript" />}
          </form.AppField>
          <form.AppField name="url" validators={{ onChange: resourceLinkSchema.shape.url }}>
            {(field) => <field.TextField label="Web address" placeholder="https://example.com/report" />}
          </form.AppField>
          <form.AppForm>
            <form.FormError />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
