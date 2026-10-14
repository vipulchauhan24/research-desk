import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { firstErrorMessage } from "./field-error";
import { useFieldContext } from "./form-context";

interface TextFieldProps {
  label: string;
  placeholder?: string;
  autoComplete?: string;
  // Right-align and use tabular figures for numeric entry.
  numeric?: boolean;
  prefix?: string;
  className?: string;
}

export function TextField({ label, placeholder, autoComplete = "off", numeric, prefix, className }: TextFieldProps) {
  const field = useFieldContext<string>();
  const { isTouched, errors, isValidating } = field.state.meta;
  // Hide errors until the user has interacted; submit marks every field touched.
  const error = isTouched ? firstErrorMessage(errors) : undefined;

  return (
    <Field
      label={label}
      error={error}
      description={isValidating && !error ? "Checking…" : undefined}
      className={cn(className)}
    >
      <Input
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        numeric={numeric}
        prefix={prefix}
      />
    </Field>
  );
}
