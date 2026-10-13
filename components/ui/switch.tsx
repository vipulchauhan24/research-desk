import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

interface SwitchProps extends ComponentProps<typeof BaseSwitch.Root> {
  label?: string;
}

export function Switch({ label, className, ...props }: SwitchProps) {
  const control = (
    <BaseSwitch.Root
      className={cn(
        "flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 p-0.5 transition-colors duration-150 data-checked:bg-indigo-600 data-disabled:cursor-not-allowed data-disabled:bg-slate-200",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="size-4 rounded-full bg-white shadow-sm transition-transform duration-150 data-checked:translate-x-4" />
    </BaseSwitch.Root>
  );

  if (!label) return control;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      {control}
      {label}
    </label>
  );
}
