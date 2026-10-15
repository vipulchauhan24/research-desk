import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

// Editable and computed cells of a data grid (Scenarios, Valuation): inputs are white with a border,
// computed values sit on a flat slate tint, so the two can be told apart at a glance.
export function GridInput({ className, ...props }: ComponentProps<typeof BaseInput>) {
  return (
    <BaseInput
      inputMode="decimal"
      className={cn(
        "h-8 w-full min-w-20 rounded-md border border-slate-300 bg-white px-2 text-right text-sm text-slate-900 tabular-nums hover:border-slate-400 focus-visible:border-indigo-500 aria-invalid:border-red-600",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}

export function GridCalcCell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-8 min-w-20 items-center justify-end rounded-md bg-slate-50 px-2 text-slate-700 tabular-nums">
      {children}
    </div>
  );
}
