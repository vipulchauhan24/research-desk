import { Field } from "@base-ui/react/field";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlBase } from "./styles";

// Must be rendered inside a <Field> so the label and validation attach to it.
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <Field.Control
      render={
        <textarea
          rows={4}
          className={cn(controlBase, "h-auto py-2 leading-5 placeholder:text-slate-400", className)}
          {...props}
        />
      }
    />
  );
}
