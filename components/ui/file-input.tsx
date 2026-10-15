import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

// A native file chooser styled like a secondary button. Must be rendered inside a <Field> so the label attaches.
// The browser owns the selected file, so this is uncontrolled: it reports the choice through onChange.
export function FileInput({ className, ...props }: Omit<ComponentProps<typeof BaseInput>, "type">) {
  return (
    <BaseInput
      type="file"
      className={cn(
        "block w-full rounded-md text-sm text-slate-500 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50 data-invalid:text-red-600",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}
