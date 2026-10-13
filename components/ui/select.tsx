import { Select as BaseSelect } from "@base-ui/react/select";
import { cn } from "@/lib/cn";
import { ChevronUpDownIcon } from "./icons";
import { controlBase, optionItem, popupSurface } from "./styles";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  items: SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

export function Select({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select",
  disabled,
  name,
  id,
  "aria-label": ariaLabel,
  className,
}: SelectProps) {
  return (
    <BaseSelect.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      disabled={disabled}
      name={name}
    >
      <BaseSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(controlBase, "flex cursor-pointer items-center justify-between gap-2 text-left", className)}
      >
        <BaseSelect.Value placeholder={placeholder} className="truncate data-placeholder:text-slate-400" />
        <BaseSelect.Icon className="text-slate-500">
          <ChevronUpDownIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50 outline-none">
          <BaseSelect.Popup className={cn(popupSurface, "min-w-(--anchor-width) p-1")}>
            <BaseSelect.List className="max-h-(--available-height) overflow-y-auto">
              {items.map((item) => (
                <BaseSelect.Item key={item.value} value={item.value} className={optionItem}>
                  <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
