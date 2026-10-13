import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlBase } from "./styles";

interface InputProps extends ComponentProps<typeof BaseInput> {
  // Numeric inputs are right-aligned.
  numeric?: boolean;
}

export function Input({ numeric, className, ...props }: InputProps) {
  return (
    <BaseInput
      className={cn(
        controlBase,
        "placeholder:text-slate-400",
        numeric && "text-right tabular-nums",
        typeof className === "string" && className,
      )}
      inputMode={numeric ? "decimal" : undefined}
      {...props}
    />
  );
}
