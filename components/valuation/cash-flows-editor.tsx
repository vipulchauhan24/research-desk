import { useId, useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { formatFiscalYear } from "@/lib/format";
import { useSaveValuationInputs } from "@/lib/queries/use-save-valuation-inputs";
import {
  cashFlowYearSchema,
  cashFlowsFormSchema,
  cashFlowsToDraft,
  cashFlowsToStored,
  CASH_FLOWS_KEY,
  CASH_FLOW_ROWS,
  draftCashFlowYears,
  MAX_FORECAST_YEARS,
  newCashFlowYear,
  type StoredCashFlows,
} from "@/lib/valuation-base-case";
import { cashFlowCalcRows, type DcfKind, type DiscountAssumptions } from "@/lib/valuation-cash-flow-table";
import { draftToLoose } from "@/lib/valuation-fields";
import { CashFlowGrid } from "./cash-flow-grid";
import { CashFlowsTitle } from "./cash-flows-title";

interface CashFlowsEditorProps {
  companyId: string;
  saved: StoredCashFlows | null;
  kind: DcfKind;
  discount: DiscountAssumptions | null;
}

export function CashFlowsEditor({ companyId, saved, kind, discount }: CashFlowsEditorProps) {
  const formId = useId();
  const saveInputs = useSaveValuationInputs();
  // Read once: ids are generated here, and a changing default would reset the form on every render.
  const [defaultValues] = useState(() => cashFlowsToDraft(saved));

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      const parsed = cashFlowsFormSchema.safeParse(value);
      if (!parsed.success) return;
      try {
        await saveInputs.mutateAsync({ companyId, key: CASH_FLOWS_KEY, inputs: cashFlowsToStored(parsed.data) });
        formApi.reset(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the cash flows.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  return (
    <>
      <CardHeader className="flex-wrap">
        <CashFlowsTitle />
        <form.AppForm>
          <div className="flex flex-wrap items-center gap-2">
            <form.Subscribe selector={(state) => state.values.years.length}>
              {(count) => (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={count >= MAX_FORECAST_YEARS}
                    onClick={() => form.pushFieldValue("years", newCashFlowYear())}
                  >
                    Add year
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={count <= 1}
                    onClick={() => void form.removeFieldValue("years", count - 1)}
                  >
                    Remove last year
                  </Button>
                </>
              )}
            </form.Subscribe>
            <form.SubmitButton label="Save cash flows" pendingLabel="Saving…" formId={formId} requireChanges />
          </div>
        </form.AppForm>
      </CardHeader>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-3 gap-3 p-4">
          <form.AppField name="firstFiscalYear" validators={{ onChange: cashFlowsFormSchema.shape.firstFiscalYear }}>
            {(field) => <field.TextField label="First forecast year (FY ending March)" numeric />}
          </form.AppField>
          <form.AppField name="taxRate" validators={{ onChange: cashFlowsFormSchema.shape.taxRate }}>
            {(field) => <field.TextField label="Tax rate (%)" numeric />}
          </form.AppField>
          <form.AppForm>
            <form.FormError className="col-span-3 text-xs text-red-600" />
          </form.AppForm>
        </div>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const firstYear = /^20\d{2}$/.test(values.firstFiscalYear) ? Number(values.firstFiscalYear) : null;
            const years = values.years.map((year, index) => ({
              id: year.id,
              label: firstYear === null ? `Year ${index + 1}` : formatFiscalYear(firstYear + index, true),
            }));
            const calcRows = cashFlowCalcRows(
              kind,
              draftCashFlowYears(values.years),
              draftToLoose("percent", values.taxRate),
              discount,
            );

            return (
              <CashFlowGrid
                years={years}
                calcRows={calcRows}
                renderInput={(key, index) => {
                  const row = CASH_FLOW_ROWS.find((candidate) => candidate.key === key);
                  return (
                    <form.AppField
                      name={`years[${index}].${key}`}
                      validators={{ onChange: cashFlowYearSchema.shape[key] }}
                    >
                      {(field) => <field.CellField label={`${row?.label}, ${years[index].label}`} />}
                    </form.AppField>
                  );
                }}
              />
            );
          }}
        </form.Subscribe>
      </form>
    </>
  );
}
