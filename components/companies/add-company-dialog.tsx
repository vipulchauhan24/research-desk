import { useId, useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  BUSINESS_TYPES,
  COMPANY_FORM_DEFAULTS,
  COMPANY_STATUSES,
  EXCHANGES,
  IDEA_SOURCES,
  companyFormSchema,
} from "@/lib/company";
import { useAddCompany } from "@/lib/queries/use-add-company";
import { useCompanyExists } from "@/lib/queries/use-company-exists";

const toItems = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const SYMBOL_CHECK_DEBOUNCE_MS = 400;

export function AddCompanyDialog() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const addCompany = useAddCompany();
  const companyExists = useCompanyExists();

  const form = useAppForm({
    defaultValues: COMPANY_FORM_DEFAULTS,
    onSubmit: async ({ value, formApi }) => {
      try {
        // Re-parse for the schema's transforms (trimmed, upper-cased symbol); validators only check.
        await addCompany.mutateAsync(companyFormSchema.parse(value));
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't add the company.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Start every open from a clean form, including after a cancelled attempt.
    if (next) form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>Add company</DialogTrigger>
      <DialogContent
        title="Add company"
        description="Start tracking a stock on NSE or BSE."
        actions={
          <form.AppForm>
            <DialogClose />
            <form.SubmitButton label="Add company" pendingLabel="Adding…" formId={formId} />
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
          className="grid grid-cols-3 gap-3"
        >
          <form.AppField name="name" validators={{ onChange: companyFormSchema.shape.name }}>
            {(field) => <field.TextField label="Company name" className="col-span-3" />}
          </form.AppField>

          <form.AppField name="exchange" validators={{ onChange: companyFormSchema.shape.exchange }}>
            {(field) => <field.SelectField label="Exchange" items={toItems(EXCHANGES)} />}
          </form.AppField>

          <form.AppField
            name="symbol"
            // A symbol is unique per exchange, so switching exchange re-runs the check.
            validators={{
              onChangeListenTo: ["exchange"],
              onChange: companyFormSchema.shape.symbol,
              onChangeAsyncDebounceMs: SYMBOL_CHECK_DEBOUNCE_MS,
              // Only runs once the sync check above passes, so we never query for a malformed symbol.
              onChangeAsync: async ({ value, fieldApi }) => {
                const symbol = value.trim().toUpperCase();
                const exchange = fieldApi.form.getFieldValue("exchange");
                return (await companyExists(exchange, symbol))
                  ? `${symbol} is already on your list for ${exchange}.`
                  : undefined;
              },
            }}
          >
            {(field) => <field.TextField label="Symbol" placeholder="e.g. KAVPREC" className="col-span-2" />}
          </form.AppField>

          <form.AppField name="businessType" validators={{ onChange: companyFormSchema.shape.businessType }}>
            {(field) => <field.SelectField label="Business type" items={toItems(BUSINESS_TYPES)} />}
          </form.AppField>

          <form.AppField name="ideaSource" validators={{ onChange: companyFormSchema.shape.ideaSource }}>
            {(field) => <field.SelectField label="Idea source" items={toItems(IDEA_SOURCES)} />}
          </form.AppField>

          <form.AppField name="status" validators={{ onChange: companyFormSchema.shape.status }}>
            {(field) => <field.SelectField label="Status" items={toItems(COMPANY_STATUSES)} />}
          </form.AppField>

          <form.AppForm>
            <form.FormError className="col-span-3 text-xs text-red-600" />
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
