import { useFormContext } from "./form-context";

// Errors that belong to the whole form (e.g. the save failed), not to one field.
export function FormError({ className }: { className?: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
      {(error) =>
        typeof error === "string" ? (
          <p role="alert" className={className ?? "text-xs text-red-600"}>
            {error}
          </p>
        ) : null
      }
    </form.Subscribe>
  );
}
