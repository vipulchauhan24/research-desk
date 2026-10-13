import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Accordion({ className, ...props }: ComponentProps<typeof BaseAccordion.Root>) {
  return (
    <BaseAccordion.Root
      className={cn(
        "divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white",
        typeof className === "string" && className,
      )}
      {...props}
    />
  );
}

interface AccordionItemProps {
  value: string;
  title: string;
  children: ReactNode;
}

export function AccordionItem({ value, title, children }: AccordionItemProps) {
  return (
    <BaseAccordion.Item value={value}>
      <BaseAccordion.Header>
        <BaseAccordion.Trigger className="group flex h-10 w-full cursor-pointer items-center justify-between px-3 text-left font-medium text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500">
          {title}
          <span aria-hidden="true" className="text-slate-500">
            <span className="group-data-panel-open:hidden">+</span>
            <span className="hidden group-data-panel-open:inline">−</span>
          </span>
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-150 data-starting-style:h-0 data-ending-style:h-0">
        <div className="px-3 pb-3 text-slate-500">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}
