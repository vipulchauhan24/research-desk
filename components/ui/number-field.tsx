import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { MinusIcon, PlusIcon } from "./icons";
import { focusRing } from "./styles";

const stepper =
  "flex w-9 cursor-pointer items-center justify-center bg-slate-50 text-slate-600 select-none hover:bg-indigo-50 hover:text-indigo-700 data-disabled:cursor-not-allowed data-disabled:text-slate-300 data-disabled:hover:bg-slate-50";

type NumberFieldProps = Omit<ComponentProps<typeof BaseNumberField.Root>, "children">;

export function NumberField({ className, ...props }: NumberFieldProps) {
  return (
    <BaseNumberField.Root className={cn("w-full", typeof className === "string" && className)} {...props}>
      <BaseNumberField.Group
        className={cn(
          "flex h-9 w-full overflow-hidden rounded-md border border-slate-300 bg-white hover:border-slate-400 focus-within:border-indigo-500 data-invalid:border-red-600",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500",
        )}
      >
        <BaseNumberField.Decrement aria-label="Decrease" className={cn(stepper, "border-r border-slate-200", focusRing)}>
          <MinusIcon />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm text-slate-900 tabular-nums outline-none disabled:text-slate-400" />
        <BaseNumberField.Increment aria-label="Increase" className={cn(stepper, "border-l border-slate-200", focusRing)}>
          <PlusIcon />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
