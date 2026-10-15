import { Field } from "@/components/ui/field";
import { FileInput } from "@/components/ui/file-input";
import { cn } from "@/lib/cn";
import { firstErrorMessage } from "./field-error";
import { useFieldContext } from "./form-context";

interface FileFieldProps {
  label: string;
  // Passed to the file chooser, e.g. ".pdf,application/pdf".
  accept?: string;
  description?: string;
  className?: string;
}

export function FileField({ label, accept, description, className }: FileFieldProps) {
  const field = useFieldContext<File | null>();
  const error = field.state.meta.isTouched ? firstErrorMessage(field.state.meta.errors) : undefined;

  return (
    <Field label={label} error={error} description={description} className={cn(className)}>
      <FileInput
        name={field.name}
        accept={accept}
        onChange={(event) => {
          field.handleChange(event.target.files?.[0] ?? null);
          // Choosing a file is the whole interaction, so validate it straight away.
          field.handleBlur();
        }}
      />
    </Field>
  );
}
