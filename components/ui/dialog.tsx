import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { Button } from "./button";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;

// A secondary "Cancel"-style button that closes the dialog.
export function DialogClose({ children = "Cancel" }: { children?: ReactNode }) {
  return <BaseDialog.Close render={<Button variant="secondary" />}>{children}</BaseDialog.Close>;
}

interface DialogContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  // Right-aligned action row. Put <DialogClose /> first, then the confirm button.
  actions?: ReactNode;
}

export function DialogContent({ title, description, children, actions }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 bg-slate-900/30 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <BaseDialog.Popup className="fixed top-1/2 left-1/2 w-lg max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg outline-none transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0">
        <BaseDialog.Title className="font-semibold text-slate-900">{title}</BaseDialog.Title>
        {description && (
          <BaseDialog.Description className="mt-1 text-slate-500">{description}</BaseDialog.Description>
        )}
        {children && <div className="mt-4">{children}</div>}
        {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
