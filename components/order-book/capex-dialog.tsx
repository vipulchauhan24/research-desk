import { useId, useLayoutEffect } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  CAPEX_DEFAULTS,
  CAPEX_STATUSES,
  capexFormSchema,
  capexToDraft,
  type CapexRow,
} from "@/lib/order-book";
import { useSaveCapexRow } from "@/lib/queries/use-save-capex-row";

interface CapexDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The project being edited, or null to add a new one.
  row: CapexRow | null;
}

const STATUS_ITEMS = CAPEX_STATUSES.map((value) => ({ value, label: value }));

export function CapexDialog({ companyId, open, onOpenChange, row }: CapexDialogProps) {
  const formId = useId();
  const saveRow = useSaveCapexRow();

  const form = useAppForm({
    defaultValues: row ? capexToDraft(row) : CAPEX_DEFAULTS,
    onSubmit: async ({ value, formApi }) => {
      // Re-parse for the conversions (₹ Cr to paise, "Q3 FY27" to year and quarter); the validators only check.
      const values = capexFormSchema.parse(value);
      try {
        await saveRow.mutateAsync({ companyId, id: row?.id, values });
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the project.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  // See OrderBookDialog: every open starts from the project being edited (or empty).
  useLayoutEffect(() => {
    if (open) form.reset(row ? capexToDraft(row) : CAPEX_DEFAULTS);
  }, [open, row, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={row ? "Edit project" : "Add project"}
        description="A capex project the company has announced, in ₹ Cr."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label={row ? "Save project" : "Add project"} pendingLabel="Saving…" formId={formId} />
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
          <form.AppField name="project" validators={{ onChange: capexFormSchema.shape.project }}>
            {(field) => <field.TextField label="Project" className="col-span-2" />}
          </form.AppField>
          <form.AppField name="capacityAdded" validators={{ onChange: capexFormSchema.shape.capacityAdded }}>
            {(field) => <field.TextField label="Capacity added (optional)" placeholder="e.g. +12,000 tpa" />}
          </form.AppField>
          <form.AppField name="outlay" validators={{ onChange: capexFormSchema.shape.outlay }}>
            {(field) => <field.TextField label="Outlay (₹ Cr)" numeric />}
          </form.AppField>
          <form.AppField name="funding" validators={{ onChange: capexFormSchema.shape.funding }}>
            {(field) => <field.TextField label="Funding source (optional)" placeholder="e.g. Term loan" />}
          </form.AppField>
          <form.AppField name="status" validators={{ onChange: capexFormSchema.shape.status }}>
            {(field) => <field.SelectField label="Status" items={STATUS_ITEMS} />}
          </form.AppField>
          <form.AppField name="commissioning" validators={{ onChange: capexFormSchema.shape.commissioning }}>
            {(field) => <field.TextField label="Expected commissioning" placeholder="Q3 FY27" />}
          </form.AppField>
          <form.AppField name="sourceNote" validators={{ onChange: capexFormSchema.shape.sourceNote }}>
            {(field) => (
              <field.TextField label="Source document (optional)" placeholder="e.g. Annual report FY26, p.38" />
            )}
          </form.AppField>
          <form.AppField name="sourceUrl" validators={{ onChange: capexFormSchema.shape.sourceUrl }}>
            {(field) => <field.TextField label="Source link (optional)" placeholder="https://example.com/report" className="col-span-2" />}
          </form.AppField>
          <form.AppForm>
            <form.FormError className="col-span-2 text-xs text-red-600" />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
