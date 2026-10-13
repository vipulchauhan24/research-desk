import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon } from "./icons";
import { focusRing } from "./styles";

interface CheckboxProps extends ComponentProps<typeof BaseCheckbox.Root> {
  // Visible label. Omit only if you pass aria-label.
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <BaseCheckbox.Root
      className={cn(
        "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-slate-400 bg-white text-white data-checked:border-indigo-600 data-checked:bg-indigo-600 data-invalid:border-red-600 data-disabled:cursor-not-allowed data-disabled:border-slate-200 data-disabled:bg-slate-100",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex data-unchecked:hidden">
        <CheckIcon width={12} height={12} strokeWidth={2.5} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );

  if (!label) return box;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      {box}
      {label}
    </label>
  );
}
