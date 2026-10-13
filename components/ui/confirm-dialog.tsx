import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  // Disables the buttons while the confirmed action is running.
  pending?: boolean;
}

// The confirm-delete dialog every destructive action goes through.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-slate-900/30 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 w-md max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg outline-none transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0">
          <AlertDialog.Title className="font-semibold text-slate-900">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-slate-500">{description}</AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="secondary" disabled={pending} />}>
              Cancel
            </AlertDialog.Close>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
