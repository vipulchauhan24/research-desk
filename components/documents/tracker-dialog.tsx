import { useId, useLayoutEffect } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useSaveTrackerRow } from "@/lib/queries/use-save-tracker-row";
import {
  TRACKER_CASES,
  TRACKER_UNITS,
  UNIT_LABEL,
  trackerDefaults,
  trackerFieldsSchema,
  trackerFormSchema,
  trackerToDraft,
  type QuarterKey,
  type TrackerRow,
} from "@/lib/tracker";

interface TrackerDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The metric being edited, or null to add a new one.
  row: TrackerRow | null;
  // A new metric starts in the quarter being viewed.
  defaultQuarter: QuarterKey | null;
  // Lets the card follow the metric to the quarter it was saved in.
  onSaved: (quarter: QuarterKey) => void;
}

const UNIT_ITEMS = TRACKER_UNITS.map((value) => ({ value, label: UNIT_LABEL[value] }));
const CASE_ITEMS = TRACKER_CASES.map((value) => ({ value, label: value }));

export function TrackerDialog({ companyId, open, onOpenChange, row, defaultQuarter, onSaved }: TrackerDialogProps) {
  const formId = useId();
  const saveRow = useSaveTrackerRow();

  const form = useAppForm({
    defaultValues: row ? trackerToDraft(row) : trackerDefaults(defaultQuarter),
    onSubmit: async ({ value, formApi }) => {
      // Re-parse for the conversions (to paise or basis points, "Q1 FY27" to year and quarter).
      const values = trackerFormSchema.parse(value);
      try {
        await saveRow.mutateAsync({ companyId, id: row?.id, values });
        onSaved(values.quarter);
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the metric.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  // See DocumentDialog: every open starts from the metric being edited (or a fresh one).
  useLayoutEffect(() => {
    if (open) form.reset(row ? trackerToDraft(row) : trackerDefaults(defaultQuarter));
  }, [open, row, defaultQuarter, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={row ? "Edit metric" : "Add metric"}
        description="What you predicted for a quarter, and what the company reported."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label={row ? "Save metric" : "Add metric"} pendingLabel="Saving…" formId={formId} />
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
          <form.AppField name="metric" validators={{ onChange: trackerFieldsSchema.shape.metric }}>
            {(field) => <field.TextField label="Metric" placeholder="e.g. Sales, OPM, Net profit" className="col-span-2" />}
          </form.AppField>
          <form.AppField name="quarter" validators={{ onChange: trackerFieldsSchema.shape.quarter }}>
            {(field) => <field.TextField label="Quarter" placeholder="Q1 FY27" />}
          </form.AppField>
          <form.AppField name="case" validators={{ onChange: trackerFieldsSchema.shape.case }}>
            {(field) => <field.SelectField label="Case" items={CASE_ITEMS} />}
          </form.AppField>
          <form.AppField name="unit" validators={{ onChange: trackerFieldsSchema.shape.unit }}>
            {(field) => <field.SelectField label="Unit" items={UNIT_ITEMS} />}
          </form.AppField>
          <div />
          <form.AppField name="predicted" validators={{ onChange: trackerFieldsSchema.shape.predicted }}>
            {(field) => <field.TextField label="Predicted" numeric />}
          </form.AppField>
          <form.AppField name="actual" validators={{ onChange: trackerFieldsSchema.shape.actual }}>
            {(field) => <field.TextField label="Actual (blank until reported)" numeric />}
          </form.AppField>
          <form.AppForm>
            <form.FormError className="col-span-2 text-xs text-red-600" />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
