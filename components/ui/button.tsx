import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "md" | "sm" | "icon" | "toolbar";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:not-data-disabled:bg-indigo-700 data-disabled:bg-indigo-200",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:not-data-disabled:bg-slate-50 data-disabled:border-slate-200 data-disabled:bg-slate-50 data-disabled:text-slate-400",
  ghost: "text-slate-700 hover:not-data-disabled:bg-slate-100 data-disabled:text-slate-400",
  destructive:
    "bg-red-600 text-white hover:not-data-disabled:bg-red-700 data-disabled:bg-red-300",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-9 px-3.5",
  sm: "h-8 px-3",
  icon: "size-8",
  // Editor toolbar: 32px tall, as narrow as a single glyph but growing for labels like "• List".
  toolbar: "h-8 min-w-8 px-2",
};

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap select-none data-disabled:cursor-not-allowed",
        focusRing,
        VARIANT[variant],
        SIZE[size],
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}
