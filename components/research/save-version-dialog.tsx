import { useId } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { saveVersionSchema, type SaveVersionDraft } from "@/lib/research";

interface SaveVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Resolves to an error message to show in the dialog, or null when the version was saved.
  onSave: (changeNote: string) => Promise<string | null>;
}

const DEFAULTS: SaveVersionDraft = { changeNote: "" };

export function SaveVersionDialog({ open, onOpenChange, onSave }: SaveVersionDialogProps) {
  const formId = useId();

  const form = useAppForm({
    defaultValues: DEFAULTS,
    onSubmit: async ({ value, formApi }) => {
      const error = await onSave(saveVersionSchema.parse(value).changeNote);
      if (error) formApi.setErrorMap({ onSubmit: { form: error, fields: {} } });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        title="Save as new version"
        description="Saves the draft as the next numbered version. Saved versions can't be edited later."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label="Save version" pendingLabel="Saving…" formId={formId} />
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
          className="flex flex-col gap-2"
        >
          <form.AppField name="changeNote" validators={{ onChange: saveVersionSchema.shape.changeNote }}>
            {(field) => <field.TextField label="What changed?" placeholder="e.g. Added Q2 FY27 order inflow" />}
          </form.AppField>
          <form.AppForm>
            <form.FormError />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
