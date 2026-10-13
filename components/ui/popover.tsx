import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { popupMotion, popupSurface } from "./styles";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

interface PopoverContentProps {
  title?: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function PopoverContent({ title, children, side = "bottom", align = "center" }: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={6} className="z-50">
        <BasePopover.Popup className={cn(popupSurface, popupMotion, "max-w-80 p-3 outline-none")}>
          {title && <BasePopover.Title className="font-medium text-slate-900">{title}</BasePopover.Title>}
          <div className="text-xs text-slate-500">{children}</div>
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
