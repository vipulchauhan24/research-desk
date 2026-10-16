import { useState } from "react";
import { useAppForm } from "@/components/form/use-app-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CASE_KEYS,
  CASE_LABEL,
  MAX_PERIODS,
  METHOD_LABEL,
  SCENARIO_METHODS,
  probabilityTotal,
  rebalanceProbabilities,
  type CaseKey,
  type GridMode,
} from "@/lib/scenarios";
import {
  addPeriod,
  canRemovePeriod,
  lenientProbabilities,
  periodFieldSchemas,
  probabilityFieldSchema,
  removePeriod,
  summarise,
  targetYearOptions,
  type GridDraft,
  type ScenarioDraft,
} from "@/lib/scenarios-form";
import { ScenarioGrid } from "./scenario-grid";
import { ScenarioSummaryCards } from "./scenario-summary";
import { CaseToggle, ModeToggle } from "./scenario-toggles";

interface ScenarioEditorProps {
  // Read once: the form owns the values from here, and a refetch must not replace what is being typed.
  initial: ScenarioDraft;
  pricePaise: number | null;
  // Called with the whole draft after every edit, to autosave it.
  onChange: (draft: ScenarioDraft) => void;
}

const METHOD_ITEMS = SCENARIO_METHODS.map((value) => ({ value, label: METHOD_LABEL[value] }));

function TotalBadge({ probabilities }: { probabilities: Record<CaseKey, string> }) {
  const parsed = CASE_KEYS.map((key) => probabilityFieldSchema.safeParse(probabilities[key]));
  const total = parsed.every((result) => result.success)
    ? probabilityTotal({ bear: Number(probabilities.bear), base: Number(probabilities.base), bull: Number(probabilities.bull) })
    : null;
  const ok = total === 100;

  return (
    <div className="flex items-center gap-2 pb-1.5">
      <span className="text-slate-500">Total</span>
      <span className="font-semibold text-slate-900">{total === null ? "—" : `${total}%`}</span>
      <Badge tone={ok ? "green" : "amber"}>{ok ? "OK" : "Must equal 100%"}</Badge>
    </div>
  );
}

export function ScenarioEditor({ initial, pricePaise, onChange }: ScenarioEditorProps) {
  const [defaultValues] = useState(initial);
  const [caseKey, setCaseKey] = useState<CaseKey>("base");
  const [mode, setMode] = useState<GridMode>("yearly");
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const form = useAppForm({
    defaultValues,
    // Fires for typing in any cell. Programmatic changes below don't, so they report themselves.
    listeners: { onChange: ({ formApi }) => onChange(formApi.state.values) },
  });

  function changeGrid(next: (grid: GridDraft) => GridDraft) {
    form.setFieldValue(mode, next(form.getFieldValue(mode)));
    onChange(form.state.values);
  }

  return (
    <div className="flex flex-col gap-4">
      <CaseToggle value={caseKey} onChange={setCaseKey} />

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="self-center font-semibold text-slate-900">Probability</div>
          {CASE_KEYS.map((key) => (
            <form.AppField
              key={key}
              name={`probabilities.${key}`}
              validators={{ onChange: probabilityFieldSchema }}
              listeners={{
                onChange: ({ fieldApi, value }) => {
                  // Only a complete number re-splits the others; half-typed text leaves them alone.
                  const typed = probabilityFieldSchema.safeParse(value);
                  if (!typed.success) return;
                  const next = rebalanceProbabilities(lenientProbabilities(fieldApi.form.state.values), key, typed.data);
                  for (const other of CASE_KEYS) {
                    if (other !== key) {
                      fieldApi.form.setFieldValue(`probabilities.${other}`, String(next[other]), { dontRunListeners: true });
                    }
                  }
                  onChange(fieldApi.form.state.values);
                },
              }}
            >
              {(field) => <field.TextField label={`${CASE_LABEL[key]} (%)`} numeric className="w-24" />}
            </form.AppField>
          ))}
          <form.Subscribe selector={(state) => state.values.probabilities}>
            {(probabilities) => <TotalBadge probabilities={probabilities} />}
          </form.Subscribe>

          <div className="ml-auto flex flex-wrap items-end gap-3">
            <form.Subscribe selector={(state) => state.values.yearly}>
              {(yearly) => (
                <form.AppField name="targetYear">
                  {(field) => <field.SelectField label="Target year" items={targetYearOptions(yearly)} className="w-32" />}
                </form.AppField>
              )}
            </form.Subscribe>
            <form.AppField name="method">
              {(field) => <field.SelectField label="Method" items={METHOD_ITEMS} className="w-56" />}
            </form.AppField>
          </div>
        </div>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => <ScenarioSummaryCards summary={summarise(values, pricePaise)} pricePaise={pricePaise} />}
        </form.Subscribe>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="flex flex-wrap items-center gap-3">
            <span>{CASE_LABEL[caseKey]} case</span>
            <ModeToggle value={mode} onChange={setMode} />
          </div>
          <form.Subscribe selector={(state) => state.values[mode]}>
            {(grid) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={grid.cases.base.length >= MAX_PERIODS}
                  onClick={() => changeGrid(addPeriod)}
                >
                  Add period
                </Button>
                <Button variant="secondary" size="sm" disabled={!canRemovePeriod(grid)} onClick={() => setConfirmingRemove(true)}>
                  Delete period
                </Button>
              </div>
            )}
          </form.Subscribe>
        </CardHeader>

        <div className="grid grid-cols-3 gap-3 p-4">
          <form.AppField key={`${mode}-start`} name={`${mode}.startYear`}>
            {(field) => <field.TextField label="First period (fiscal year, e.g. 2027)" numeric />}
          </form.AppField>
          {mode === "quarterly" && (
            <form.AppField name="quarterly.startQuarter">
              {(field) => <field.TextField label="First quarter (1–4)" numeric />}
            </form.AppField>
          )}
          <form.AppField key={`${mode}-actual`} name={`${mode}.actualCount`}>
            {(field) => <field.TextField label="Reported periods" numeric />}
          </form.AppField>
        </div>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <ScenarioGrid
              grid={values[mode]}
              mode={mode}
              method={values.method}
              caseKey={caseKey}
              renderInput={(row, index, isActual, periodLabel) => {
                const { field: periodField } = row;
                if (!periodField) return null;
                // Reported periods are facts shared by every case, so they are typed once, under Base.
                return (
                  <form.AppField
                    name={`${mode}.cases.${isActual ? "base" : caseKey}[${index}].${periodField}`}
                    validators={{ onChange: periodFieldSchemas[periodField] }}
                  >
                    {(field) => <field.CellField label={`${row.label}, ${periodLabel}`} />}
                  </form.AppField>
                );
              }}
            />
          )}
        </form.Subscribe>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3.5 rounded border border-slate-300 bg-white" />
            Editable input
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-slate-50 ring-1 ring-slate-100" />
            Computed, read-only
          </span>
          <span>Reported periods are shared by all cases and typed under Base</span>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        title="Delete the last period?"
        description={`The last ${mode === "yearly" ? "year" : "quarter"} is removed from the Bear, Base and Bull grids, with everything typed in it.`}
        confirmLabel="Delete period"
        onConfirm={() => {
          changeGrid(removePeriod);
          setConfirmingRemove(false);
        }}
      />
    </div>
  );
}
