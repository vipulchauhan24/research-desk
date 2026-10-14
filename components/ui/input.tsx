import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlBase } from "./styles";

interface InputProps extends ComponentProps<typeof BaseInput> {
  // Numeric inputs are right-aligned.
  numeric?: boolean;
  // A fixed leading symbol such as "₹", drawn inside the field.
  prefix?: string;
}

export function Input({ numeric, prefix, className, ...props }: InputProps) {
  const input = (
    <BaseInput
      className={cn(
        controlBase,
        "placeholder:text-slate-400",
        numeric && "text-right tabular-nums",
        prefix && "pl-7!",
        typeof className === "string" && className,
      )}
      inputMode={numeric ? "decimal" : undefined}
      {...props}
    />
  );

  if (!prefix) return input;

  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
        {prefix}
      </span>
      {input}
    </div>
  );
}
