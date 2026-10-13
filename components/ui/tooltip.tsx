import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

// Mount once in _app so tooltips share open delays.
export const TooltipProvider = BaseTooltip.Provider;

interface TooltipProps {
  content: ReactNode;
  // The element that triggers the tooltip. For a disabled control, wrap it in a focusable <span>.
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white transition-opacity duration-100 data-starting-style:opacity-0 data-ending-style:opacity-0">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
