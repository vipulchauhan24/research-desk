import { useAppForm } from "@/components/form/use-app-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { linkSchema, type LinkDraft } from "@/lib/research";
import { useId, useLayoutEffect } from "react";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The link under the cursor, if any, so it can be edited or removed.
  initialUrl: string;
  onSubmit: (url: string) => void;
  onRemove: () => void;
}

export function LinkDialog({ open, onOpenChange, initialUrl, onSubmit, onRemove }: LinkDialogProps) {
  const formId = useId();
  const defaultValues: LinkDraft = { url: initialUrl };

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(linkSchema.parse(value).url),
  });

  // The toolbar opens this dialog by setting `open`, which the dialog never reports back through onOpenChange
  // (that only fires for changes the dialog itself makes, like closing). So reset here, before the first paint,
  // so every open starts from the link under the cursor and never from a previous attempt.
  useLayoutEffect(() => {
    if (open) form.reset({ url: initialUrl });
  }, [open, initialUrl, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={initialUrl ? "Edit link" : "Add link"}
        description="Links open in a new tab when you view a saved version."
        actions={
          <form.AppForm>
            {initialUrl && (
              <Button variant="ghost" onClick={onRemove} className="mr-auto">
                Remove link
              </Button>
            )}
            <DialogClose />
            <form.SubmitButton label={initialUrl ? "Update link" : "Add link"} pendingLabel="Saving…" formId={formId} />
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
        >
          <form.AppField name="url" validators={{ onChange: linkSchema.shape.url }}>
            {(field) => <field.TextField label="Web address" placeholder="https://example.com/report" />}
          </form.AppField>
        </form>
      </DialogContent>
    </Dialog>
  );
}
