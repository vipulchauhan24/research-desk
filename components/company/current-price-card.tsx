import { useAppForm } from "@/components/form/use-app-form";
import { Card } from "@/components/ui/card";
import { priceFormSchema, type PriceFormDraft } from "@/lib/company";
import { formatDate, formatPrice } from "@/lib/format";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/money";
import type { CompanyListItem } from "@/lib/queries/use-companies";
import { useSetCompanyPrice } from "@/lib/queries/use-set-company-price";

function UpdatedOn({ company }: { company: CompanyListItem }) {
  return (
    <span className="text-xs text-slate-500">
      {company.priceAsOf ? `Updated ${formatDate(company.priceAsOf)}` : "No price entered yet"}
    </span>
  );
}

export function CurrentPriceCard({ company }: { company: CompanyListItem }) {
  const setPrice = useSetCompanyPrice();
  const defaultValues: PriceFormDraft = { price: paiseToRupeesInput(company.pricePaise) };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      // The price saves on blur, so a blur without an edit must not write a new dated entry.
      if (!formApi.state.isDirty) return;
      const pricePaise = rupeesToPaise(priceFormSchema.parse(value).price);
      try {
        await setPrice.mutateAsync({ companyId: company.id, pricePaise });
        formApi.reset({ price: paiseToRupeesInput(pricePaise) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save the price.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  return (
    <Card className="px-4 py-3">
      {/* Mobile is read-only: show the figure, not the input. */}
      <div className="md:hidden">
        <div className="text-xs font-medium text-slate-500">Current price</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{formatPrice(company.pricePaise)}</div>
        <UpdatedOn company={company} />
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="hidden md:block"
      >
        <div className="flex items-end gap-3">
          <form.AppField
            name="price"
            validators={{ onChange: priceFormSchema.shape.price }}
            listeners={{ onBlur: ({ fieldApi }) => void fieldApi.form.handleSubmit() }}
          >
            {(field) => <field.TextField label="Current price (entered manually)" prefix="₹" numeric className="w-44" />}
          </form.AppField>
          <div className="pb-2">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (isSubmitting ? <span className="text-xs text-slate-500">Saving…</span> : <UpdatedOn company={company} />)}
            </form.Subscribe>
          </div>
        </div>
        <form.AppForm>
          <form.FormError className="mt-1 text-xs text-red-600" />
        </form.AppForm>
      </form>
    </Card>
  );
}
