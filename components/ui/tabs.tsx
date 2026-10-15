import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export const Tabs = BaseTabs.Root;

// The row scrolls horizontally instead of wrapping (required on mobile). The divider lives on a wrapper and the
// list overlaps it by 1px: putting -mb-px on each tab instead leaves 1px of vertical overflow, which shows a scrollbar.
export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <div className="border-b border-slate-200">
      <BaseTabs.List
        className={cn("-mb-px flex gap-6 overflow-x-auto", typeof className === "string" && className)}
        {...props}
      />
    </div>
  );
}

export function TabsTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "shrink-0 cursor-pointer border-b-2 border-transparent px-0.5 py-2.5 text-sm font-medium whitespace-nowrap text-slate-500 hover:text-slate-700 data-active:border-indigo-600 data-active:text-indigo-700 data-disabled:cursor-not-allowed data-disabled:text-slate-300 data-disabled:hover:text-slate-300",
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

// Pill tabs for a second level of navigation under the underline tabs (e.g. valuation methods).
// The list is padded so the focus ring of the first and last pill isn't clipped by the scroll container.
export function PillTabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn("flex gap-1 overflow-x-auto p-1 max-md:flex-nowrap md:flex-wrap", typeof className === "string" && className)}
      {...props}
    />
  );
}

export function PillTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "h-8 shrink-0 cursor-pointer rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100 max-md:h-11 data-active:border-indigo-200 data-active:bg-indigo-50 data-active:text-indigo-700",
        focusRing,
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}
