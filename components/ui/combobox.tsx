import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cn } from "@/lib/cn";
import { ChevronDownIcon, XIcon } from "./icons";
import { controlBase, optionItem, popupSurface } from "./styles";

export interface ComboboxOption {
  value: string;
  label: string;
  // Right-aligned muted text, e.g. the NSE symbol next to a company name.
  secondary?: string;
}

interface ComboboxProps {
  items: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
}

function findOption(items: ComboboxOption[], value: string | null | undefined) {
  if (value === undefined) return undefined;
  return items.find((item) => item.value === value) ?? null;
}

export function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyText = "No results",
  disabled,
  name,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  return (
    <BaseCombobox.Root
      items={items}
      value={findOption(items, value)}
      defaultValue={findOption(items, defaultValue)}
      onValueChange={(next) => onValueChange?.(next?.value ?? null)}
      disabled={disabled}
      name={name}
    >
      <BaseCombobox.InputGroup className={cn(controlBase, "relative flex items-center p-0 pl-3 focus-within:border-indigo-500 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500")}>
        <BaseCombobox.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <BaseCombobox.Clear
          aria-label="Clear selection"
          className="flex h-full w-7 cursor-pointer items-center justify-center text-slate-400 hover:text-slate-700"
        >
          <XIcon />
        </BaseCombobox.Clear>
        <BaseCombobox.Trigger
          aria-label="Open options"
          className="flex h-full w-8 cursor-pointer items-center justify-center text-slate-500"
        >
          <ChevronDownIcon />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={6} className="z-50 outline-none">
          <BaseCombobox.Popup className={cn(popupSurface, "w-(--anchor-width) p-1")}>
            <BaseCombobox.Empty className="px-2 py-1.5 text-sm text-slate-500 empty:hidden">
              {emptyText}
            </BaseCombobox.Empty>
            <BaseCombobox.List className="max-h-72 overflow-y-auto">
              {(item: ComboboxOption) => (
                <BaseCombobox.Item
                  key={item.value}
                  value={item}
                  className={cn(optionItem, "flex items-center justify-between gap-3")}
                >
                  <span>{item.label}</span>
                  {item.secondary && (
                    <span className="text-xs font-normal text-slate-500">{item.secondary}</span>
                  )}
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
