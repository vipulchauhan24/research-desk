import { useId, useLayoutEffect } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  ORDER_BOOK_DEFAULTS,
  ORDER_STATUSES,
  orderBookFormSchema,
  orderBookToDraft,
  type OrderBookRow,
} from "@/lib/order-book";
import { useSaveOrderBookRow } from "@/lib/queries/use-save-order-book-row";

interface OrderBookDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The order being edited, or null to add a new one.
  row: OrderBookRow | null;
}

const STATUS_ITEMS = ORDER_STATUSES.map((value) => ({ value, label: value }));

export function OrderBookDialog({ companyId, open, onOpenChange, row }: OrderBookDialogProps) {
  const formId = useId();
  const saveRow = useSaveOrderBookRow();

  const form = useAppForm({
    defaultValues: row ? orderBookToDraft(row) : ORDER_BOOK_DEFAULTS,
    onSubmit: async ({ value, formApi }) => {
      // Re-parse for the conversions (₹ Cr to paise, month to a date); the validators only check.
      const values = orderBookFormSchema.parse(value);
      try {
        await saveRow.mutateAsync({ companyId, id: row?.id, values });
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the order.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  // The parent opens this dialog by setting `open`, so reset here: every open starts from the order being
  // edited (or empty), never from a previous attempt.
  useLayoutEffect(() => {
    if (open) form.reset(row ? orderBookToDraft(row) : ORDER_BOOK_DEFAULTS);
  }, [open, row, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={row ? "Edit order" : "Add order"}
        description="An order in the company's order book, in ₹ Cr."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label={row ? "Save order" : "Add order"} pendingLabel="Saving…" formId={formId} />
          </form.AppForm>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid grid-cols-2 gap-3"
        >
          <form.AppField name="customer" validators={{ onChange: orderBookFormSchema.shape.customer }}>
            {(field) => <field.TextField label="Customer or segment" className="col-span-2" />}
          </form.AppField>
          <form.AppField name="orderedOn" validators={{ onChange: orderBookFormSchema.shape.orderedOn }}>
            {(field) => <field.TextField label="Order month (YYYY-MM)" placeholder="2026-06" numeric />}
          </form.AppField>
          <form.AppField name="value" validators={{ onChange: orderBookFormSchema.shape.value }}>
            {(field) => <field.TextField label="Value (₹ Cr)" numeric />}
          </form.AppField>
          <form.AppField name="executionBy" validators={{ onChange: orderBookFormSchema.shape.executionBy }}>
            {(field) => <field.TextField label="Execution by (YYYY-MM)" placeholder="2028-03" numeric />}
          </form.AppField>
          <form.AppField name="status" validators={{ onChange: orderBookFormSchema.shape.status }}>
            {(field) => <field.SelectField label="Status" items={STATUS_ITEMS} />}
          </form.AppField>
          <form.AppField name="sourceNote" validators={{ onChange: orderBookFormSchema.shape.sourceNote }}>
            {(field) => (
              <field.TextField label="Source document (optional)" placeholder="e.g. Q1 FY27 concall, p.4" className="col-span-2" />
            )}
          </form.AppField>
          <form.AppField name="sourceUrl" validators={{ onChange: orderBookFormSchema.shape.sourceUrl }}>
            {(field) => (
              <field.TextField label="Source link (optional)" placeholder="https://example.com/report" className="col-span-2" />
            )}
          </form.AppField>
          <form.AppForm>
            <form.FormError className="col-span-2 text-xs text-red-600" />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
