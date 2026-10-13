import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";
import { Tooltip } from "./tooltip";

// Segmented control: always exactly one item selected.
interface ToggleGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label": string;
  children: ReactNode;
  className?: string;
}

export function ToggleGroup({ value, defaultValue, onValueChange, children, className, ...props }: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      value={value === undefined ? undefined : [value]}
      defaultValue={defaultValue === undefined ? undefined : [defaultValue]}
      onValueChange={(next) => {
        // Clicking the selected item would empty the group; ignore it.
        if (next.length > 0) onValueChange?.(next[next.length - 1]);
      }}
      className={cn("inline-flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5", className)}
      {...props}
    >
      {children}
    </BaseToggleGroup>
  );
}

interface ToggleGroupItemProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  // Shown on hover/focus when the item is disabled, e.g. "Coming later".
  disabledReason?: string;
}

export function ToggleGroupItem({ value, children, disabled, disabledReason }: ToggleGroupItemProps) {
  const item = (
    <Toggle
      value={value}
      disabled={disabled}
      className={cn(
        "h-7 cursor-pointer rounded-[5px] max-md:h-10 px-3 text-[13px] font-medium text-slate-600 select-none data-pressed:bg-white data-pressed:text-slate-900 data-pressed:shadow-sm data-disabled:cursor-not-allowed data-disabled:text-slate-400",
        focusRing,
      )}
    >
      {children}
    </Toggle>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip content={disabledReason}>
        <span tabIndex={0} className={cn("rounded-[5px]", focusRing)}>
          {item}
        </span>
      </Tooltip>
    );
  }

  return item;
}
