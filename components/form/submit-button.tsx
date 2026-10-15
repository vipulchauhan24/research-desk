import { Button } from "@/components/ui/button";
import { useFormContext } from "./form-context";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  // The button often sits outside the <form> (e.g. in a dialog's action row), so it targets the form by id.
  formId: string;
  // For forms that stay open after saving: nothing to save until something changed.
  requireChanges?: boolean;
}

export function SubmitButton({ label, pendingLabel, formId, requireChanges }: SubmitButtonProps) {
  const form = useFormContext();

  // Select only what the button shows, so keystrokes in fields don't re-render it.
  return (
    <form.Subscribe selector={(state) => (state.isSubmitting ? "submitting" : state.isDirty ? "dirty" : "clean")}>
      {(phase) => (
        <Button type="submit" form={formId} disabled={phase === "submitting" || (requireChanges && phase === "clean")}>
          {phase === "submitting" ? pendingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
