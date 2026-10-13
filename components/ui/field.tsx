import { Field as BaseField } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  error?: string;
  description?: string;
  className?: string;
  // The control: Input, Textarea, Select, Combobox, NumberField. It is wired to the label automatically.
  children: ReactNode;
}

export function Field({ label, error, description, className, children }: FieldProps) {
  return (
    <BaseField.Root invalid={Boolean(error)} className={cn("flex flex-col items-stretch", className)}>
      <BaseField.Label className="mb-1 text-xs font-medium text-slate-500">{label}</BaseField.Label>
      {children}
      {error && (
        <BaseField.Error match className="mt-1 text-xs text-red-600">
          {error}
        </BaseField.Error>
      )}
      {description && (
        <BaseField.Description className="mt-1 text-xs text-slate-500">
          {description}
        </BaseField.Description>
      )}
    </BaseField.Root>
  );
}
