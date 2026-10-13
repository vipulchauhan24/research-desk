import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { popupMotion, popupSurface } from "./styles";

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;

export function MenuContent({ children, align = "end" }: { children: ReactNode; align?: "start" | "center" | "end" }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={6} className="z-50 outline-none">
        <BaseMenu.Popup className={cn(popupSurface, popupMotion, "min-w-40 p-1 outline-none")}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

interface MenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export function MenuItem({ children, onClick, shortcut, destructive, disabled }: MenuItemProps) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex cursor-default items-center justify-between gap-6 rounded px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-slate-100 data-disabled:text-slate-400",
        destructive ? "text-red-700" : "text-slate-700 data-highlighted:text-slate-900",
      )}
    >
      {children}
      {shortcut && <span className="text-xs text-slate-400">{shortcut}</span>}
    </BaseMenu.Item>
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="my-1 h-px bg-slate-200" />;
}
