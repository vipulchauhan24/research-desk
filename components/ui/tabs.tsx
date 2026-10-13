import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export const Tabs = BaseTabs.Root;

// The row scrolls horizontally instead of wrapping (required on mobile).
export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn(
        "flex gap-6 overflow-x-auto border-b border-slate-200",
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}

export function TabsTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "-mb-px shrink-0 cursor-pointer border-b-2 border-transparent px-0.5 py-2.5 text-sm font-medium whitespace-nowrap text-slate-500 hover:text-slate-700 data-active:border-indigo-600 data-active:text-indigo-700 data-disabled:cursor-not-allowed data-disabled:text-slate-300 data-disabled:hover:text-slate-300",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}

export function TabsPanel({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel
      className={cn("pt-4 outline-none", typeof className === "string" && className)}
      {...props}
    />
  );
}
