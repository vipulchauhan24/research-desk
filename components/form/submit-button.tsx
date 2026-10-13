import { Button } from "@/components/ui/button";
import { useFormContext } from "./form-context";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  // The button often sits outside the <form> (e.g. in a dialog's action row), so it targets the form by id.
  formId: string;
}

export function SubmitButton({ label, pendingLabel, formId }: SubmitButtonProps) {
  const form = useFormContext();

  // Select only what the button shows, so keystrokes in fields don't re-render it.
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" form={formId} disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
