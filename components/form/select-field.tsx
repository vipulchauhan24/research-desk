import { Field } from "@/components/ui/field";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { firstErrorMessage } from "./field-error";
import { useFieldContext } from "./form-context";

interface SelectFieldProps {
  label: string;
  items: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function SelectField({ label, items, placeholder, className }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? firstErrorMessage(field.state.meta.errors) : undefined;

  return (
    <Field label={label} error={error} className={cn(className)}>
      <Select
        items={items}
        placeholder={placeholder}
        // An empty string means "nothing chosen yet"; the select models that as null.
        value={field.state.value || null}
        onValueChange={(value) => {
          field.handleChange(value ?? "");
          field.handleBlur();
        }}
      />
    </Field>
  );
}
