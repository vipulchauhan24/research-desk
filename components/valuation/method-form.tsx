import { useId, useMemo, useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { useSaveValuationInputs } from "@/lib/queries/use-save-valuation-inputs";
import {
  crossFieldErrors,
  evaluateMethod,
  methodFieldSchemas,
  methodToDraft,
  parseMethodDraft,
  type EvaluationContext,
  type MethodSpec,
  type MethodValues,
} from "@/lib/valuation-methods";
import { MethodCard } from "./method-card";
import { ResultCard } from "./result-card";

interface MethodFormProps {
  companyId: string;
  spec: MethodSpec;
  saved: MethodValues | null;
  context: EvaluationContext;
}

export function MethodForm({ companyId, spec, saved, context }: MethodFormProps) {
  const formId = useId();
  const saveInputs = useSaveValuationInputs();
  const fieldSchemas = useMemo(() => methodFieldSchemas(spec), [spec]);
  // Read once: the form owns the values from here, and a refetch must not reset what is being typed.
  const [defaultValues] = useState(() => methodToDraft(spec, saved));

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: ({ value }) => {
        const fields = crossFieldErrors(spec, value);
        return fields ? { fields } : undefined;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      // Re-parse for the conversions (₹ Cr and ₹ to paise); the validators only check.
      const parsed = parseMethodDraft(spec, value);
      if (!parsed) return;
      try {
        await saveInputs.mutateAsync({ companyId, key: spec.id, inputs: parsed });
        // The saved values become the new baseline, so the form reads as unchanged until the next edit.
        formApi.reset(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save these inputs.";
        formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      }
    },
  });

  return (
    <MethodCard
      title={spec.title}
      inputs={
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-3 gap-3">
            {spec.fields.map((field) => (
              <form.AppField key={field.key} name={field.key} validators={{ onChange: fieldSchemas[field.key] }}>
                {(formField) => <formField.TextField label={field.label} numeric />}
              </form.AppField>
            ))}
          </div>
          <form.AppForm>
            <div className="flex items-center gap-3">
              <form.SubmitButton label="Save inputs" pendingLabel="Saving…" formId={formId} requireChanges />
              <form.FormError />
            </div>
          </form.AppForm>
        </form>
      }
      result={
        // The result follows the typed values, saved or not, so the effect of an assumption is visible straight away.
        <form.Subscribe selector={(state) => state.values}>
          {(values) => <ResultCard result={evaluateMethod(spec, parseMethodDraft(spec, values), context)} />}
        </form.Subscribe>
      }
    />
  );
}
