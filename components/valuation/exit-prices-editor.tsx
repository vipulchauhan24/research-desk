import { useId, useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { CardHeader } from "@/components/ui/card";
import { useSaveValuationInputs } from "@/lib/queries/use-save-valuation-inputs";
import {
  buyingPriceRows,
  draftExitPrices,
  EXIT_HORIZONS,
  EXIT_PRICES_KEY,
  exitPricesFormSchema,
  exitPricesToDraft,
  type StoredExitPrices,
} from "@/lib/valuation-base-case";
import { BuyingPriceTable } from "./buying-price-table";
import { BuyingPriceTitle } from "./buying-price-title";

interface ExitPricesEditorProps {
  companyId: string;
  saved: StoredExitPrices | null;
  currentPriceRupees: number | null;
}

export function ExitPricesEditor({ companyId, saved, currentPriceRupees }: ExitPricesEditorProps) {
  const formId = useId();
  const saveInputs = useSaveValuationInputs();
  const [defaultValues] = useState(() => exitPricesToDraft(saved));

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      const parsed = exitPricesFormSchema.safeParse(value);
      if (!parsed.success) return;
      try {
        await saveInputs.mutateAsync({ companyId, key: EXIT_PRICES_KEY, inputs: parsed.data });
        formApi.reset(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the exit prices.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  return (
    <>
      <CardHeader>
        <BuyingPriceTitle />
        <form.AppForm>
          <form.SubmitButton label="Save exit prices" pendingLabel="Saving…" formId={formId} requireChanges />
        </form.AppForm>
      </CardHeader>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="grid grid-cols-3 gap-3 p-4"
      >
        {EXIT_HORIZONS.map((years) => (
          <form.AppField key={years} name={`y${years}`} validators={{ onChange: exitPricesFormSchema.shape[`y${years}`] }}>
            {(field) => <field.TextField label={`Base-case exit price in ${years} years (₹)`} prefix="₹" numeric />}
          </form.AppField>
        ))}
        <form.AppForm>
          <form.FormError className="col-span-3 text-xs text-red-600" />
        </form.AppForm>
      </form>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => <BuyingPriceTable rows={buyingPriceRows(draftExitPrices(values), currentPriceRupees)} />}
      </form.Subscribe>
    </>
  );
}
