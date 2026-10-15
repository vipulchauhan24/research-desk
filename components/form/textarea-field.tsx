import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { firstErrorMessage } from "./field-error";
import { useFieldContext } from "./form-context";

interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextareaField({ label, placeholder, rows, className }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? firstErrorMessage(field.state.meta.errors) : undefined;

  return (
    <Field label={label} error={error} className={cn(className)}>
      <Textarea
        name={field.name}
        rows={rows}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
      />
    </Field>
  );
}
